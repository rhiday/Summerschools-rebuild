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
if (typeof window !== 'undefined' && window.MemberStack) {
    window.$memberstackDom = window.MemberStack.init({
        publicKey: window.MEMBERSTACK_CONFIG.publicKey
    });
    
    console.log('Memberstack initialized with public key');
} else {
    console.log('Waiting for Memberstack DOM package to load...');
    
    // Retry initialization after DOM package loads
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (window.MemberStack) {
                window.$memberstackDom = window.MemberStack.init({
                    publicKey: window.MEMBERSTACK_CONFIG.publicKey
                });
                console.log('Memberstack initialized after delay');
            }
        }, 1000);
    });
}