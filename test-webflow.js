#!/usr/bin/env node

// Webflow Integration Test Script (API v2)
// Run this to validate your Webflow API connection and data structure
// Updated for Webflow API v2 (v1 was sunset January 1, 2025)

require('dotenv').config();

const WEBFLOW_API_TOKEN = process.env.WEBFLOW_API_TOKEN;
const COLLECTION_ID = process.env.WEBFLOW_COLLECTION_ID || '672bbb0fffd67079e532dfd9';
const SITE_ID = process.env.WEBFLOW_SITE_ID;

async function testWebflowConnection() {
    console.log('🧪 Testing Webflow API Connection...\n');
    
    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log(`WEBFLOW_API_TOKEN: ${WEBFLOW_API_TOKEN ? '✅ Set' : '❌ Missing'}`);
    console.log(`WEBFLOW_COLLECTION_ID: ${COLLECTION_ID || '❌ Missing'}`);
    console.log(`WEBFLOW_SITE_ID: ${SITE_ID ? '✅ Set' : '❌ Missing'}\n`);
    
    if (!WEBFLOW_API_TOKEN) {
        console.error('❌ WEBFLOW_API_TOKEN is required. Please check your .env file.');
        return false;
    }
    
    try {
        // Test 1: Verify API token by getting site info
        console.log('🔑 Testing API Token...');
        const siteResponse = await fetch(`https://api.webflow.com/v2/sites`, {
            headers: {
                'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`
            }
        });
        
        if (!siteResponse.ok) {
            const error = await siteResponse.text();
            console.error(`❌ API Token test failed: ${siteResponse.status} - ${error}`);
            return false;
        }
        
        const sites = await siteResponse.json();
        console.log(`✅ API Token valid. Found ${sites.length} sites.\n`);
        
        // Test 2: Check if collection exists
        console.log('📂 Testing Collection Access...');
        const collectionResponse = await fetch(`https://api.webflow.com/v2/collections/${COLLECTION_ID}`, {
            headers: {
                'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`
            }
        });
        
        if (!collectionResponse.ok) {
            const error = await collectionResponse.text();
            console.error(`❌ Collection test failed: ${collectionResponse.status} - ${error}`);
            console.log('💡 Tip: Check your WEBFLOW_COLLECTION_ID in the .env file');
            return false;
        }
        
        const collection = await collectionResponse.json();
        console.log(`✅ Collection found: "${collection.name}"`);
        console.log(`📝 Collection fields:`, collection.fields.map(f => f.slug).join(', '));
        console.log();
        
        // Test 3: List existing items
        console.log('📋 Testing Collection Items...');
        const itemsResponse = await fetch(`https://api.webflow.com/v2/collections/${COLLECTION_ID}/items`, {
            headers: {
                'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`
            }
        });
        
        if (!itemsResponse.ok) {
            const error = await itemsResponse.text();
            console.error(`❌ Items test failed: ${itemsResponse.status} - ${error}`);
            return false;
        }
        
        const items = await itemsResponse.json();
        console.log(`✅ Found ${items.items ? items.items.length : 0} existing items in collection\n`);
        
        // Test 4: Create a test item
        console.log('🧪 Testing Item Creation...');
        const testItem = {
            fieldData: {
                name: `Test Course ${Date.now()}`,
                slug: `test-course-${Date.now()}`
            },
            isDraft: true
        };
        
        const createResponse = await fetch(`https://api.webflow.com/v2/collections/${COLLECTION_ID}/items`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testItem)
        });
        
        if (!createResponse.ok) {
            const error = await createResponse.text();
            console.error(`❌ Create test failed: ${createResponse.status} - ${error}`);
            console.log('💡 This might indicate field mapping issues. Check the collection schema.');
            return false;
        }
        
        const createdItem = await createResponse.json();
        console.log(`✅ Test item created successfully: ${createdItem.id}`);
        
        // Clean up test item
        await fetch(`https://api.webflow.com/v2/collections/${COLLECTION_ID}/items/${createdItem.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`
            }
        });
        console.log(`🧹 Test item cleaned up\n`);
        
        console.log('🎉 All tests passed! Webflow integration is working correctly.');
        return true;
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        return false;
    }
}

// Run the test
if (require.main === module) {
    testWebflowConnection().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { testWebflowConnection };