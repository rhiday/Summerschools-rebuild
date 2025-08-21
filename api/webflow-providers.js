// Vercel Serverless Function for Webflow Provider CMS Integration (API v2)
// This handles all CRUD operations for providers in Webflow CMS

const WEBFLOW_API_TOKEN = process.env.WEBFLOW_API_TOKEN;
const PROVIDER_COLLECTION_ID = process.env.WEBFLOW_PROVIDER_COLLECTION_ID || '672bbb0fffd67079e532dfb1';
const SITE_ID = process.env.WEBFLOW_SITE_ID;

// Validate required environment variables
if (!WEBFLOW_API_TOKEN) {
    console.error('WEBFLOW_API_TOKEN environment variable is required');
}
if (!SITE_ID) {
    console.error('WEBFLOW_SITE_ID environment variable is required');
}

// Helper function to format provider data for Webflow
function formatProviderForWebflow(providerData) {
    console.log('Input providerData:', providerData);
    
    // Generate a URL-safe slug
    const generateSlug = (name) => {
        if (!name) return 'untitled-provider';
        return name.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    // Get the provider name
    const providerName = providerData['School-name'] || providerData.schoolName || 'Untitled Provider';
    
    // Map form fields to Webflow Provider collection fields
    const webflowItem = {
        fieldData: {
            // Required fields
            name: providerName,
            slug: generateSlug(providerName),
            
            // Provider details
            'company-description': providerData['Short-bio'] || providerData.shortBio || '',
            'company-desc-2': providerData['Details-school-bio'] || providerData.detailsSchoolBio || '',
            'founded-year-2': providerData['Year-founded'] || providerData.yearFounded || '',
            accomodation: providerData['Accomodation-type'] || providerData.accomodationType || '',
            
            // Program details
            'date-2': providerData['Course-Date'] || providerData.courseDate || '',
            'duration-2': providerData['Courses-duration'] || providerData.courseDuration || '',
            'age-range': providerData['Age-Range'] || providerData.ageRange || '',
            'fees-2': providerData['Fees-from'] || providerData.feesFrom || '',
            
            // Additional fields
            orders: 0, // Default order
            'no-index': false // Default SEO setting
        },
        isDraft: true
    };

    console.log('Formatted webflowItem:', webflowItem);
    return webflowItem;
}

// Main handler function
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { action, providerId, ...providerData } = req.body || {};

    try {
        let response;
        let result;

        switch (action || req.method) {
            case 'CREATE':
            case 'POST':
                try {
                    console.log('Creating provider with data:', providerData);
                    
                    // Create new provider
                    const newProvider = formatProviderForWebflow(providerData);
                    console.log('Sending to Webflow:', JSON.stringify(newProvider, null, 2));
                    
                    response = await fetch(`https://api.webflow.com/v2/collections/${PROVIDER_COLLECTION_ID}/items`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(newProvider)
                    });

                    console.log('Webflow response status:', response.status);
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('Webflow API error response:', {
                            status: response.status,
                            statusText: response.statusText,
                            body: errorText,
                            headers: Object.fromEntries(response.headers.entries())
                        });
                        
                        // Return specific error messages for different status codes
                        if (response.status === 401) {
                            throw new Error('Invalid Webflow API token. Please check your credentials.');
                        } else if (response.status === 400) {
                            throw new Error(`Invalid request data: ${errorText}`);
                        } else if (response.status === 404) {
                            throw new Error('Webflow provider collection not found. Please check your collection ID.');
                        }
                        
                        throw new Error(`Webflow API error: ${response.status} - ${errorText}`);
                    }

                    result = await response.json();
                    console.log('Webflow success response:', result);
                    
                    return res.status(200).json({
                        success: true,
                        message: 'Provider created successfully',
                        data: result
                    });
                } catch (createError) {
                    console.error('Create provider error:', createError);
                    throw createError;
                }

            case 'UPDATE':
            case 'PUT':
            case 'PATCH':
                // Update existing provider
                if (!providerId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Provider ID is required for updates'
                    });
                }

                const updatedProvider = formatProviderForWebflow(providerData);
                
                response = await fetch(`https://api.webflow.com/v2/collections/${PROVIDER_COLLECTION_ID}/items/${providerId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedProvider)
                });

                if (!response.ok) {
                    const error = await response.text();
                    throw new Error(`Webflow API error: ${response.status} - ${error}`);
                }

                result = await response.json();
                
                return res.status(200).json({
                    success: true,
                    message: 'Provider updated successfully',
                    data: result
                });

            case 'DELETE':
                // Delete provider
                if (!providerId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Provider ID is required for deletion'
                    });
                }

                response = await fetch(`https://api.webflow.com/v2/collections/${PROVIDER_COLLECTION_ID}/items/${providerId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`
                    }
                });

                if (!response.ok) {
                    const error = await response.text();
                    throw new Error(`Webflow API error: ${response.status} - ${error}`);
                }

                return res.status(200).json({
                    success: true,
                    message: 'Provider deleted successfully'
                });

            case 'LIST':
            case 'GET':
                // Get all providers
                response = await fetch(`https://api.webflow.com/v2/collections/${PROVIDER_COLLECTION_ID}/items`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`
                    }
                });

                if (!response.ok) {
                    const error = await response.text();
                    throw new Error(`Webflow API error: ${response.status} - ${error}`);
                }

                result = await response.json();
                
                return res.status(200).json({
                    success: true,
                    data: result.items || []
                });

            case 'ARCHIVE':
                // Archive a provider
                if (!providerId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Provider ID is required for archiving'
                    });
                }

                // First, get the current provider data
                const archiveGetResponse = await fetch(`https://api.webflow.com/v2/collections/${PROVIDER_COLLECTION_ID}/items/${providerId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`
                    }
                });

                if (!archiveGetResponse.ok) {
                    throw new Error(`Failed to fetch provider for archiving`);
                }

                const providerToArchive = await archiveGetResponse.json();
                
                // Update with archived status (using a custom field or draft status)
                const archivedProvider = {
                    fieldData: {
                        ...providerToArchive.fieldData,
                        '_archived': true
                    },
                    isDraft: true // Archive by setting as draft
                };

                const archiveResponse = await fetch(`https://api.webflow.com/v2/collections/${PROVIDER_COLLECTION_ID}/items/${providerId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(archivedProvider)
                });

                if (!archiveResponse.ok) {
                    const error = await archiveResponse.text();
                    throw new Error(`Failed to archive provider: ${error}`);
                }

                result = await archiveResponse.json();
                
                return res.status(200).json({
                    success: true,
                    message: 'Provider archived successfully',
                    data: result
                });

            default:
                return res.status(405).json({
                    success: false,
                    message: `Method ${req.method} not allowed`
                });
        }
    } catch (error) {
        console.error('Webflow Provider API Error:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            requestData: { action, providerId, ...providerData }
        });
        
        // Return more specific error information
        const errorMessage = error.message || 'An error occurred while processing your request';
        const statusCode = error.message?.includes('Invalid Webflow API token') ? 401 : 
                          error.message?.includes('not found') ? 404 : 500;
        
        return res.status(statusCode).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}