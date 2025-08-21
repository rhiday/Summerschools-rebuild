// Enhanced Authentication Manager
// Handles both Memberstack authentication and local development fallback

class AuthManager {
    constructor() {
        this.isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.memberstackReady = false;
        this.currentUser = null;
        this.callbacks = {
            onLogin: [],
            onLogout: [],
            onReady: []
        };
        
        console.log('🔧 AuthManager initialized', {
            isLocalhost: this.isLocalhost,
            hostname: window.location.hostname
        });
        
        this.init();
    }
    
    async init() {
        try {
            console.log('🔄 Initializing authentication...');
            
            // Try Memberstack first
            const memberstackSuccess = await this.initMemberstack();
            
            if (memberstackSuccess) {
                console.log('✅ Using Memberstack authentication');
                await this.checkMemberstackUser();
            } else if (this.isLocalhost) {
                console.log('⚠️ Memberstack failed, using local fallback');
                this.initLocalFallback();
            } else {
                console.error('❌ Authentication failed and no fallback available');
                throw new Error('Authentication system unavailable');
            }
            
            this.triggerCallbacks('onReady');
        } catch (error) {
            console.error('❌ Authentication initialization failed:', error);
        }
    }
    
    async initMemberstack() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 20;
            
            const checkMemberstack = () => {
                attempts++;
                console.log(`Checking Memberstack (${attempts}/${maxAttempts})...`);
                
                if (window.MemberStack && window.MemberStack.onReady) {
                    console.log('✅ MemberStack found');
                    
                    window.MemberStack.onReady.then(() => {
                        if (window.$memberstackDom) {
                            console.log('✅ Memberstack DOM ready');
                            this.memberstackReady = true;
                            resolve(true);
                        } else {
                            console.warn('⚠️ Memberstack DOM not available');
                            resolve(false);
                        }
                    }).catch(error => {
                        console.warn('⚠️ Memberstack onReady error:', error);
                        resolve(false);
                    });
                } else if (attempts < maxAttempts) {
                    setTimeout(checkMemberstack, 300);
                } else {
                    console.warn('⚠️ Memberstack not found after max attempts');
                    resolve(false);
                }
            };
            
            checkMemberstack();
        });
    }
    
    async checkMemberstackUser() {
        try {
            const member = await window.$memberstackDom.getCurrentMember();
            if (member && member.data) {
                console.log('✅ Memberstack user found:', member.data.email);
                this.currentUser = {
                    id: member.data.id,
                    email: member.data.email,
                    source: 'memberstack',
                    data: member.data
                };
                return true;
            }
        } catch (error) {
            console.log('ℹ️ No Memberstack user:', error.message);
        }
        return false;
    }
    
    initLocalFallback() {
        console.log('🔧 Initializing local authentication fallback...');
        
        // Check for stored user
        const storedUser = localStorage.getItem('localAuthUser');
        if (storedUser) {
            try {
                this.currentUser = JSON.parse(storedUser);
                console.log('✅ Local user restored:', this.currentUser.email);
                return;
            } catch (error) {
                console.warn('⚠️ Invalid stored user data');
                localStorage.removeItem('localAuthUser');
            }
        }
        
        // Mock users for development
        this.mockUsers = [
            { id: 'local_1', email: 'provider@test.com', password: 'password123', role: 'provider' },
            { id: 'local_2', email: 'admin@test.com', password: 'password123', role: 'admin' },
            { id: 'local_3', email: 'shahriar.rhiday@gmail.com', password: 'password123', role: 'provider' }
        ];
        
        console.log('🔧 Local fallback ready with mock users:', this.mockUsers.map(u => u.email));
    }
    
    async signIn(email, password) {
        try {
            console.log('🔐 Attempting sign in:', email);
            
            if (this.memberstackReady) {
                return await this.memberstackSignIn(email, password);
            } else if (this.isLocalhost) {
                return await this.localSignIn(email, password);
            } else {
                throw new Error('Authentication system not available');
            }
        } catch (error) {
            console.error('❌ Sign in failed:', error);
            throw error;
        }
    }
    
    async memberstackSignIn(email, password) {
        const result = await window.$memberstackDom.signIn({
            email: email,
            password: password
        });
        
        if (result && result.data) {
            this.currentUser = {
                id: result.data.id,
                email: result.data.email,
                source: 'memberstack',
                data: result.data
            };
            
            this.triggerCallbacks('onLogin', this.currentUser);
            return result;
        } else {
            throw new Error('Invalid login response from Memberstack');
        }
    }
    
    async localSignIn(email, password) {
        const user = this.mockUsers.find(u => u.email === email && u.password === password);
        
        if (user) {
            this.currentUser = {
                id: user.id,
                email: user.email,
                source: 'local',
                role: user.role,
                data: { ...user, password: undefined } // Don't store password
            };
            
            localStorage.setItem('localAuthUser', JSON.stringify(this.currentUser));
            console.log('✅ Local sign in successful:', email);
            
            this.triggerCallbacks('onLogin', this.currentUser);
            return { data: this.currentUser };
        } else {
            throw new Error('Invalid email or password');
        }
    }
    
    async signOut() {
        try {
            if (this.currentUser?.source === 'memberstack' && this.memberstackReady) {
                await window.$memberstackDom.signOut();
            } else {
                localStorage.removeItem('localAuthUser');
            }
            
            console.log('✅ User signed out');
            this.currentUser = null;
            this.triggerCallbacks('onLogout');
            
        } catch (error) {
            console.error('❌ Sign out error:', error);
            throw error;
        }
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    isAuthenticated() {
        return this.currentUser !== null;
    }
    
    // Event system
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }
    
    off(event, callback) {
        if (this.callbacks[event]) {
            const index = this.callbacks[event].indexOf(callback);
            if (index > -1) {
                this.callbacks[event].splice(index, 1);
            }
        }
    }
    
    triggerCallbacks(event, data = null) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} callback:`, error);
                }
            });
        }
    }
    
    // Utility methods
    requireAuth(redirectUrl = '/auth.html') {
        if (!this.isAuthenticated()) {
            console.log('🚫 Authentication required, redirecting...');
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }
    
    getMembershipInfo() {
        if (!this.currentUser) return null;
        
        return {
            id: this.currentUser.id,
            email: this.currentUser.email,
            source: this.currentUser.source,
            isLocal: this.currentUser.source === 'local'
        };
    }
}

// Global instance
window.authManager = new AuthManager();

// Backward compatibility
window.checkAuth = () => window.authManager.requireAuth();
window.getCurrentUser = () => window.authManager.getCurrentUser();
window.logout = () => window.authManager.signOut();

console.log('✅ AuthManager loaded globally');