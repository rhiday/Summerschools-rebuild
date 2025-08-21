// Memberstack Configuration
// This file contains the public configuration for Memberstack

window.MEMBERSTACK_CONFIG = {
    // Memberstack public key
    publicKey: 'pk_4f1166cfc3dc4380712e',
    
    // Optional: Custom login redirect
    loginRedirect: '/index.html',
    
    // Optional: Custom signup redirect  
    signupRedirect: '/index.html',
    
    // Optional: Enable debug mode for development
    debug: true
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