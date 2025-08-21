#!/usr/bin/env node

// Test script to verify image upload functionality
require('dotenv').config();

const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

async function testImageUpload() {
    console.log('🧪 Testing Image Upload to Webflow...\n');

    try {
        // Create a test image file (1x1 pixel PNG)
        const testImageBuffer = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
            0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
            0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
            0x01, 0x00, 0x01, 0xEA, 0x2D, 0x73, 0x7C, 0x00, 0x00, 0x00, 0x00, 0x49,
            0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
        ]);

        // Write test image to temp file
        fs.writeFileSync('/tmp/test-image.png', testImageBuffer);

        // Create form data
        const form = new FormData();
        form.append('action', 'CREATE');
        form.append('School-name', 'Test School for Image Upload');
        form.append('Short-bio', 'Testing image upload functionality');
        form.append('Profile-Image', fs.createReadStream('/tmp/test-image.png'), {
            filename: 'test-logo.png',
            contentType: 'image/png'
        });

        console.log('📤 Submitting test form with image...');

        // Test the provider API endpoint
        const response = await fetch('https://summerschools-rebuild-potpqo5qt-rhidzs-projects.vercel.app/api/webflow-providers', {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        const result = await response.text();
        console.log('📥 Response status:', response.status);
        console.log('📥 Response:', result);

        if (response.ok) {
            console.log('✅ Image upload test PASSED!');
            
            // Try to parse JSON response
            try {
                const jsonResult = JSON.parse(result);
                if (jsonResult.success) {
                    console.log('✅ Provider created successfully with image!');
                    console.log('🔗 Provider ID:', jsonResult.data?.id);
                } else {
                    console.log('❌ Provider creation failed:', jsonResult.message);
                }
            } catch (e) {
                console.log('⚠️  Response is not JSON, but upload completed');
            }
        } else {
            console.log('❌ Image upload test FAILED');
        }

        // Clean up
        fs.unlinkSync('/tmp/test-image.png');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the test
if (require.main === module) {
    testImageUpload();
}

module.exports = { testImageUpload };