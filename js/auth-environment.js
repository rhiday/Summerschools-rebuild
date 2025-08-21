// Environment-Aware Authentication System
// Automatically switches between Memberstack (production) and local auth (development)

class EnvironmentAuth {
    constructor() {
        this.isProduction = this.detectEnvironment();
        this.currentUser = null;
        this.callbacks = { onLogin: [], onLogout: [], onReady: [] };
        
        console.log(`🌍 Auth Environment: ${this.isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
        console.log(`📍 Domain: ${window.location.hostname}`);
        
        this.init();
    }
    
    detectEnvironment() {
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
        const isVercelPreview = hostname.includes('vercel.app');
        const isCustomDomain = !isLocalhost && !isVercelPreview;
        
        // Production: custom domain or main vercel deployment
        // Development: localhost or preview deployments
        return isCustomDomain || (isVercelPreview && !hostname.includes('git-'));
    }
    
    async init() {
        if (this.isProduction) {
            await this.initMemberstack();
        } else {
            this.initLocalAuth();
        }
        
        this.triggerCallbacks('onReady');
    }
    
    // PRODUCTION - Memberstack Integration
    async initMemberstack() {
        console.log('🔄 Initializing Memberstack for production...');
        
        return new Promise((resolve) => {
            // Load Memberstack script dynamically
            if (!document.querySelector('script[src*="memberstack"]')) {
                const script = document.createElement('script');
                script.src = 'https://static.memberstack.com/scripts/v1/memberstack-dom.js';
                script.setAttribute('data-memberstack-app', 'app_cm42ruz6100e40st17ebveb3p');
                document.head.appendChild(script);
                
                script.onload = () => this.waitForMemberstack(resolve);
                script.onerror = () => {
                    console.error('❌ Memberstack script failed to load, falling back to local auth');
                    this.initLocalAuth();
                    resolve();
                };
            } else {
                this.waitForMemberstack(resolve);
            }
        });
    }
    
    waitForMemberstack(resolve) {
        let attempts = 0;
        const maxAttempts = 20;
        
        const check = () => {
            attempts++;
            if (window.MemberStack && window.MemberStack.onReady) {
                window.MemberStack.onReady.then(() => {
                    if (window.$memberstackDom) {
                        console.log('✅ Memberstack ready for production');
                        this.checkMemberstackUser().then(resolve);
                    } else {
                        console.warn('⚠️ Memberstack DOM not available');
                        this.initLocalAuth();
                        resolve();
                    }
                }).catch(() => {
                    this.initLocalAuth();
                    resolve();
                });
            } else if (attempts < maxAttempts) {
                setTimeout(check, 300);
            } else {
                console.warn('⚠️ Memberstack timeout, using local fallback');
                this.initLocalAuth();
                resolve();
            }
        };
        
        check();
    }
    
    async checkMemberstackUser() {
        try {
            const member = await window.$memberstackDom.getCurrentMember();
            if (member && member.data) {
                this.currentUser = {
                    id: member.data.id,
                    email: member.data.email,
                    source: 'memberstack',
                    data: member.data
                };
                console.log('✅ Memberstack user found:', this.currentUser.email);
            }
        } catch (error) {
            console.log('ℹ️ No Memberstack user logged in');
        }
    }
    
    // DEVELOPMENT - Local Authentication
    initLocalAuth() {
        console.log('🔧 Initializing local authentication for development...');
        
        this.mockUsers = [
            { id: 'local_1', email: 'provider@test.com', password: 'password123', role: 'provider' },
            { id: 'local_2', email: 'admin@test.com', password: 'password123', role: 'admin' },
            { id: 'local_3', email: 'shahriar.rhiday@gmail.com', password: 'password123', role: 'provider' }
        ];
        
        // Check for stored user
        const stored = localStorage.getItem('localAuthUser');
        if (stored) {
            try {
                this.currentUser = JSON.parse(stored);
                console.log('✅ Local user restored:', this.currentUser.email);
            } catch (error) {
                localStorage.removeItem('localAuthUser');
            }
        }
    }
    
    // UNIVERSAL METHODS
    async signIn(email, password) {
        console.log('🔐 Sign in attempt:', email, 'Environment:', this.isProduction ? 'PRODUCTION' : 'DEV');
        
        if (this.isProduction && window.$memberstackDom) {
            return await this.memberstackSignIn(email, password);
        } else {
            return await this.localSignIn(email, password);
        }
    }
    
    async memberstackSignIn(email, password) {
        const result = await window.$memberstackDom.signIn({ email, password });
        
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
            throw new Error('Memberstack login failed');
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
                data: { ...user, password: undefined }
            };
            
            localStorage.setItem('localAuthUser', JSON.stringify(this.currentUser));
            this.triggerCallbacks('onLogin', this.currentUser);
            
            return { data: this.currentUser, success: true };
        } else {
            throw new Error('Invalid email or password');
        }
    }
    
    async signOut() {
        if (this.isProduction && window.$memberstackDom) {
            try {
                await window.$memberstackDom.signOut();
            } catch (error) {
                console.warn('Memberstack signOut error:', error);
            }
        }
        
        localStorage.removeItem('localAuthUser');
        this.currentUser = null;
        this.triggerCallbacks('onLogout');
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    isAuthenticated() {
        return this.currentUser !== null;
    }
    
    getEnvironmentInfo() {
        return {
            isProduction: this.isProduction,
            hostname: window.location.hostname,
            authSource: this.currentUser?.source || 'none',
            memberstackAvailable: typeof window.$memberstackDom !== 'undefined'
        };
    }
    
    // Event system
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
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
    
    requireAuth(redirectUrl = '/auth.html') {
        if (!this.isAuthenticated()) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }
}

// Global instance
window.environmentAuth = new EnvironmentAuth();

// Backward compatibility
window.getCurrentUser = () => window.environmentAuth.getCurrentUser();
window.logout = () => window.environmentAuth.signOut();
window.checkAuth = () => window.environmentAuth.requireAuth();

console.log('✅ Environment-aware authentication system loaded');