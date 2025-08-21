#!/usr/bin/env node

// Test script to fetch Memberstack users from our API
// Run with: node test-memberstack-users.js

async function fetchMemberstackUsers() {
    console.log('🔍 Fetching Memberstack users...\n');
    
    try {
        // Use local API endpoint for testing
        const apiUrl = process.argv[2] === '--local' 
            ? 'http://localhost:3000/api/memberstack-users'
            : 'https://summerschools-rebuild-potpqo5qt-rhidzs-projects.vercel.app/api/memberstack-users';
        
        console.log(`📡 Calling API: ${apiUrl}\n`);
        
        const response = await fetch(apiUrl);
        const result = await response.json();
        
        if (result.success) {
            console.log(`✅ Successfully fetched ${result.totalMembers} users\n`);
            console.log('='.repeat(80));
            
            result.members.forEach((member, index) => {
                console.log(`\n👤 User #${index + 1}`);
                console.log('-'.repeat(40));
                console.log(`📧 Email: ${member.email}`);
                console.log(`🆔 Member ID: ${member.id}`);
                console.log(`📅 Created: ${new Date(member.createdAt).toLocaleDateString()}`);
                
                if (member.customFields && Object.keys(member.customFields).length > 0) {
                    console.log(`📝 Custom Fields:`, member.customFields);
                }
                
                if (member.planConnections && member.planConnections.length > 0) {
                    console.log(`📋 Plans:`, member.planConnections.map(p => p.planId).join(', '));
                }
                
                console.log(`\n💡 ${member.loginHint}`);
            });
            
            console.log('\n' + '='.repeat(80));
            console.log('\n📌 Use these credentials to test login at:');
            console.log('   https://summerschools-rebuild-potpqo5qt-rhidzs-projects.vercel.app/auth.html');
            
        } else {
            console.log('❌ Failed to fetch users:', result.message);
            
            if (result.help) {
                console.log('\n💡 Help:', result.help);
            }
            
            if (result.message.includes('MEMBERSTACK_SECRET_KEY')) {
                console.log('\n📝 To fix this:');
                console.log('1. Get your secret key from Memberstack Dashboard > Settings > API Keys');
                console.log('2. Add it to Vercel: Settings > Environment Variables');
                console.log('3. Add variable: MEMBERSTACK_SECRET_KEY = sk_...');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n💡 Make sure the API endpoint is deployed and accessible');
    }
}

// Run the test
fetchMemberstackUsers();