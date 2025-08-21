// Memberstack Configuration
// This file contains the public configuration for Memberstack

window.MEMBERSTACK_CONFIG = {
    // Memberstack app ID (matches the script tag)
    appId: 'app_cm42ruz6100e40st17ebveb3p',
    
    // Memberstack public key - UPDATE THIS WITH YOUR ACTUAL PUBLIC KEY
    // Get this from Memberstack Dashboard > Settings > API Keys
    publicKey: 'pk_4f1166cfc3dc4380712e',
    
    // Optional: Custom login redirect
    loginRedirect: '/index.html',
    
    // Optional: Custom signup redirect  
    signupRedirect: '/index.html',
    
    // Optional: Enable debug mode for development
    debug: true,
    
    // Development settings
    development: {
        allowLocalhost: true,
        corsOrigins: ['http://localhost:8000', 'http://127.0.0.1:8000']
    }
};

// Initialize Memberstack DOM package when ready
document.addEventListener('DOMContentLoaded', function() {
    // The DOM package auto-initializes via the data-memberstack-app attribute
    // We just need to wait for it to be ready
    
    function checkMemberstackReady() {
        if (typeof window.$memberstackDom !== 'undefined') {
            console.log('✅ Memberstack DOM package ready');
            return true;
        } else if (typeof window.MemberStack !== 'undefined' && window.MemberStack.onReady) {
            console.log('⏳ Waiting for Memberstack DOM package to initialize...');
            window.MemberStack.onReady.then(function() {
                console.log('✅ Memberstack DOM package initialized');
            });
            return true;
        }
        return false;
    }
    
    // Check immediately
    if (!checkMemberstackReady()) {
        // Retry after delay
        setTimeout(function() {
            if (!checkMemberstackReady()) {
                console.error('❌ Memberstack DOM package could not be initialized');
                console.error('Make sure the script tag includes data-memberstack-app attribute');
            }
        }, 2000);
    }
});