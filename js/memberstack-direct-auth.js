// Direct Memberstack API Authentication Service
// Uses REST API calls instead of DOM package

class MemberstackDirectAuth {
    constructor() {
        this.publicKey = 'pk_4f1166cfc3dc4380712e';
        this.apiBase = 'https://api.memberstack.com/v1';
        this.currentUser = null;
        this.loadCurrentUser();
    }

    // Load current user from localStorage
    loadCurrentUser() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
    }

    // Save current user to localStorage
    saveCurrentUser(user) {
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
    }

    // Sign in with email and password using direct API
    async signIn(email, password) {
        try {
            console.log('🔐 Attempting direct Memberstack API login for:', email);

            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': this.publicKey
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            console.log('Memberstack API response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                console.error('Memberstack API error:', errorData);
                
                if (response.status === 401) {
                    throw new Error('Invalid email or password');
                } else if (response.status === 400) {
                    throw new Error('Invalid email or password format');
                } else if (response.status === 403) {
                    throw new Error('Account access denied');
                } else {
                    throw new Error(errorData.message || 'Login failed');
                }
            }

            const data = await response.json();
            console.log('✅ Login successful:', data);

            // Extract member information
            const member = data.member || data.data || data;
            
            if (member && member.id) {
                const sessionUser = {
                    id: member.id,
                    memberId: member.id,
                    email: member.email || email,
                    name: member.customFields?.name || member.metadata?.name || email.split('@')[0],
                    role: member.customFields?.role || 'provider',
                    signedInAt: new Date().toISOString(),
                    token: data.token || data.access_token // Store auth token if provided
                };

                this.saveCurrentUser(sessionUser);

                return {
                    success: true,
                    user: sessionUser,
                    message: 'Signed in successfully'
                };
            } else {
                throw new Error('Invalid response structure from Memberstack');
            }

        } catch (error) {
            console.error('❌ Direct API login error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Sign up with email and password using direct API
    async signUp(userData) {
        try {
            // Validate passwords match
            if (userData.password !== userData.confirmPassword) {
                throw new Error('Passwords do not match');
            }

            console.log('📝 Creating account via direct Memberstack API for:', userData.email);

            const response = await fetch(`${this.apiBase}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': this.publicKey
                },
                body: JSON.stringify({
                    email: userData.email,
                    password: userData.password,
                    customFields: {
                        name: userData.name,
                        role: userData.role
                    }
                })
            });

            console.log('Memberstack signup response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                console.error('Memberstack signup error:', errorData);
                
                if (response.status === 400 && errorData.message?.includes('already exists')) {
                    throw new Error('An account with this email already exists');
                } else if (response.status === 400) {
                    throw new Error('Invalid signup data');
                } else {
                    throw new Error(errorData.message || 'Signup failed');
                }
            }

            const data = await response.json();
            console.log('✅ Signup successful:', data);

            // Extract member information
            const member = data.member || data.data || data;
            
            if (member && member.id) {
                const sessionUser = {
                    id: member.id,
                    memberId: member.id,
                    email: member.email || userData.email,
                    name: userData.name,
                    role: userData.role,
                    signedInAt: new Date().toISOString(),
                    token: data.token || data.access_token
                };

                this.saveCurrentUser(sessionUser);

                return {
                    success: true,
                    user: sessionUser,
                    message: 'Account created successfully'
                };
            } else {
                throw new Error('Invalid response structure from Memberstack');
            }

        } catch (error) {
            console.error('❌ Direct API signup error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Get current member using direct API
    async getCurrentMember() {
        if (!this.currentUser || !this.currentUser.token) {
            return null;
        }

        try {
            const response = await fetch(`${this.apiBase}/members/me`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.currentUser.token}`
                }
            });

            if (!response.ok) {
                console.log('Failed to get current member, clearing session');
                this.signOut();
                return null;
            }

            const data = await response.json();
            return data.member || data.data || data;

        } catch (error) {
            console.error('Error getting current member:', error);
            return null;
        }
    }

    // Sign out
    async signOut() {
        try {
            // If we have a token, try to invalidate it
            if (this.currentUser && this.currentUser.token) {
                await fetch(`${this.apiBase}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.currentUser.token}`
                    }
                }).catch(() => {
                    // Ignore logout API errors
                });
            }
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            // Clear local session regardless
            this.currentUser = null;
            localStorage.removeItem('currentUser');
            window.location.href = 'auth.html';
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user has specific role
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }

    // Redirect to dashboard if authenticated
    redirectToDashboard() {
        if (this.isAuthenticated()) {
            window.location.href = 'index.html';
        }
    }

    // Require authentication (redirect to auth page if not signed in)
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'auth.html';
            return false;
        }
        return true;
    }

    // Alternative login method for testing different endpoints
    async alternativeLogin(email, password) {
        try {
            console.log('🔄 Trying alternative login endpoint...');

            // Try different API endpoint structure
            const endpoints = [
                `${this.apiBase}/members/login`,
                `${this.apiBase}/auth/email-login`,
                'https://api.memberstack.com/v2/auth/login'
            ];

            for (const endpoint of endpoints) {
                try {
                    console.log(`Trying endpoint: ${endpoint}`);
                    
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-API-KEY': this.publicKey,
                            'Authorization': `Bearer ${this.publicKey}`
                        },
                        body: JSON.stringify({
                            email: email,
                            password: password
                        })
                    });

                    console.log(`Response status for ${endpoint}:`, response.status);

                    if (response.ok) {
                        const data = await response.json();
                        console.log(`✅ Success with ${endpoint}:`, data);
                        return data;
                    } else {
                        const errorText = await response.text();
                        console.log(`❌ Error with ${endpoint}:`, errorText);
                    }
                } catch (error) {
                    console.log(`❌ Exception with ${endpoint}:`, error.message);
                }
            }

            throw new Error('All alternative endpoints failed');

        } catch (error) {
            console.error('Alternative login failed:', error);
            throw error;
        }
    }
}

// Global auth service instance using direct API
const directAuthService = new MemberstackDirectAuth();

// Make it globally available
window.authService = directAuthService;
window.memberstackDirectAuth = directAuthService;

console.log('✅ Memberstack Direct API Auth Service loaded');