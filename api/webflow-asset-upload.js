// Webflow Asset Upload Utility for Images
// Handles the two-step upload process: metadata creation + S3 upload

const crypto = require('crypto');
const fs = require('fs');

// Generate MD5 hash from file buffer
function generateMD5Hash(fileBuffer) {
    return crypto.createHash('md5').update(fileBuffer).digest('hex');
}

// Upload asset to Webflow (two-step process)
async function uploadAssetToWebflow(fileBuffer, fileName, siteId, apiToken) {
    try {
        console.log(`Starting upload for ${fileName} to site ${siteId}`);
        
        // Step 1: Generate MD5 hash
        const fileHash = generateMD5Hash(fileBuffer);
        console.log(`Generated MD5 hash: ${fileHash}`);
        
        // Step 2: Create asset metadata in Webflow
        const metadataResponse = await fetch(`https://api.webflow.com/v2/sites/${siteId}/assets`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fileName: fileName,
                fileHash: fileHash
            })
        });

        if (!metadataResponse.ok) {
            const errorText = await metadataResponse.text();
            console.error('Metadata creation failed:', {
                status: metadataResponse.status,
                error: errorText
            });
            throw new Error(`Asset metadata creation failed: ${metadataResponse.status} - ${errorText}`);
        }

        const metadataResult = await metadataResponse.json();
        console.log('Metadata created:', metadataResult);

        // Step 3: Upload file to S3 using provided details
        const uploadDetails = metadataResult.uploadDetails;
        const uploadUrl = metadataResult.uploadUrl;

        // Prepare form data for S3 upload  
        const FormData = require('form-data');
        const formData = new FormData();
        
        // Add all the upload details as form fields (order matters!)
        Object.entries(uploadDetails).forEach(([key, value]) => {
            formData.append(key, value);
        });
        
        // Add the file last (this is important for S3)
        formData.append('file', fileBuffer, {
            filename: fileName,
            contentType: getMimeType(fileName)
        });

        // Upload to S3
        const s3Response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });

        if (!s3Response.ok) {
            const errorText = await s3Response.text();
            console.error('S3 upload failed:', {
                status: s3Response.status,
                error: errorText
            });
            throw new Error(`S3 upload failed: ${s3Response.status} - ${errorText}`);
        }

        console.log('S3 upload successful');

        // Return the asset URL that can be used in Webflow collections
        return {
            success: true,
            assetId: metadataResult.id,
            assetUrl: metadataResult.url || `https://assets-global.website-files.com/${siteId}/${fileName}`,
            fileName: fileName,
            fileHash: fileHash
        };

    } catch (error) {
        console.error('Asset upload error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Get MIME type from file extension
function getMimeType(fileName) {
    const extension = fileName.toLowerCase().split('.').pop();
    const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'webp': 'image/webp',
        'avif': 'image/avif'
    };
    return mimeTypes[extension] || 'application/octet-stream';
}

// Handle file upload from form data
async function processFormFileUpload(file, siteId, apiToken) {
    try {
        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);
        
        // Validate file size (4MB for images)
        if (fileBuffer.length > 4 * 1024 * 1024) {
            throw new Error('Image file size must be less than 4MB');
        }
        
        // Validate file type
        const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'avif'];
        const extension = file.name.toLowerCase().split('.').pop();
        if (!allowedTypes.includes(extension)) {
            throw new Error(`Unsupported file type: ${extension}. Allowed: ${allowedTypes.join(', ')}`);
        }
        
        // Upload to Webflow
        return await uploadAssetToWebflow(fileBuffer, file.name, siteId, apiToken);
        
    } catch (error) {
        console.error('File processing error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Export functions
module.exports = {
    uploadAssetToWebflow,
    processFormFileUpload
};