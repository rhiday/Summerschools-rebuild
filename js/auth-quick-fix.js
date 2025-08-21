// Quick Fix - Force Local Auth Until Memberstack is Fixed
// This bypasses the Memberstack 403 error

window.quickAuthFix = {
    mockUsers: [
        { id: 'local_1', email: 'provider@test.com', password: 'password123', role: 'provider' },
        { id: 'local_2', email: 'admin@test.com', password: 'password123', role: 'admin' },
        { id: 'local_3', email: 'shahriar.rhiday@gmail.com', password: 'password123', role: 'provider' }
    ],
    
    getCurrentUser: function() {
        try {
            const stored = localStorage.getItem('localAuthUser');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            localStorage.removeItem('localAuthUser');
            return null;
        }
    },
    
    signIn: function(email, password) {
        const user = this.mockUsers.find(u => u.email === email && u.password === password);
        if (user) {
            const currentUser = {
                id: user.id,
                email: user.email,
                source: 'local',
                role: user.role,
                data: { ...user, password: undefined }
            };
            localStorage.setItem('localAuthUser', JSON.stringify(currentUser));
            return { data: currentUser, success: true };
        }
        return { success: false, error: 'Invalid email or password' };
    },
    
    signOut: function() {
        localStorage.removeItem('localAuthUser');
        return { success: true };
    }
};

// Override environmentAuth to use local auth
if (window.environmentAuth) {
    window.environmentAuth.signIn = window.quickAuthFix.signIn;
    window.environmentAuth.getCurrentUser = window.quickAuthFix.getCurrentUser;
    window.environmentAuth.signOut = window.quickAuthFix.signOut;
}

// Make it globally available
window.localAuth = window.quickAuthFix;

console.log('✅ Quick auth fix applied - using local authentication');
console.log('Available test accounts:');
console.log('• shahriar.rhiday@gmail.com / password123');
console.log('• provider@test.com / password123');
console.log('• admin@test.com / password123');