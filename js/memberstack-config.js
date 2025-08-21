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

// Initialize Memberstack when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a moment for Memberstack script to fully load
    setTimeout(function() {
        if (typeof window.memberstack !== 'undefined') {
            // Memberstack 2.0 is already initialized via data attribute
            window.$memberstackDom = window.memberstack;
            console.log('✅ Memberstack 2.0 already initialized');
        } else if (typeof window.MemberStack !== 'undefined') {
            // Initialize Memberstack 1.0
            try {
                window.$memberstackDom = window.MemberStack.init({
                    publicKey: window.MEMBERSTACK_CONFIG.publicKey
                });
                console.log('✅ Memberstack 1.0 initialized with public key');
            } catch (error) {
                console.error('❌ Memberstack initialization error:', error);
            }
        } else {
            console.warn('⚠️ Memberstack not found. Retrying...');
            
            // Final retry after longer delay
            setTimeout(function() {
                if (typeof window.memberstack !== 'undefined') {
                    window.$memberstackDom = window.memberstack;
                    console.log('✅ Memberstack 2.0 found after retry');
                } else {
                    console.error('❌ Memberstack could not be initialized');
                }
            }, 2000);
        }
    }, 500);
});