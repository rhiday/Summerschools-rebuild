// Authentication Service with Memberstack Integration
// This connects to Memberstack for user authentication and management

class AuthService {
    constructor() {
        this.memberstack = null;
        this.currentUser = null;
        this.isInitialized = false;
        
        // Mock users for fallback (will be removed once Memberstack is connected)
        this.mockUsers = [
            {
                id: 'user_1',
                memberId: 'mem_12345',
                email: 'provider@test.com',
                password: 'password123',
                name: 'Test Provider',
                role: 'provider',
                createdAt: new Date().toISOString()
            },
            {
                id: 'user_2',
                memberId: 'mem_67890',
                email: 'admin@test.com',
                password: 'password123',
                name: 'Platform Admin',
                role: 'admin',
                createdAt: new Date().toISOString()
            }
        ];
        
        this.initializeMemberstack();
        this.loadCurrentUser();
    }

    // Initialize Memberstack
    async initializeMemberstack() {
        try {
            // Wait for Memberstack to be available
            if (typeof window !== 'undefined' && window.MemberStack) {
                this.memberstack = window.MemberStack;
                this.isInitialized = true;
                console.log('Memberstack initialized successfully');
                
                // Check if user is already signed in
                await this.checkExistingSession();
            } else {
                // Retry after a short delay
                setTimeout(() => this.initializeMemberstack(), 500);
            }
        } catch (error) {
            console.error('Failed to initialize Memberstack:', error);
            this.isInitialized = false;
        }
    }

    // Check for existing Memberstack session
    async checkExistingSession() {
        if (!this.memberstack) return;
        
        try {
            const member = await this.memberstack.getCurrentMember();
            if (member) {
                const sessionUser = {
                    id: member.id,
                    memberId: member.id,
                    email: member.email,
                    name: member.customFields?.name || member.email,
                    role: member.planConnections?.[0]?.planId || 'member',
                    signedInAt: new Date().toISOString()
                };
                
                this.saveCurrentUser(sessionUser);
            }
        } catch (error) {
            console.log('No existing Memberstack session found');
        }
    }

    // Load current user from localStorage (session persistence)
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

    // Sign in with email and password (Memberstack + fallback)
    async signIn(email, password) {
        try {
            // Try Memberstack first
            if (this.isInitialized && this.memberstack) {
                try {
                    const member = await this.memberstack.signIn({
                        email: email,
                        password: password
                    });
                    
                    if (member) {
                        const sessionUser = {
                            id: member.id,
                            memberId: member.id,
                            email: member.email,
                            name: member.customFields?.name || member.email,
                            role: member.planConnections?.[0]?.planId || 'member',
                            signedInAt: new Date().toISOString()
                        };
                        
                        this.saveCurrentUser(sessionUser);
                        
                        return {
                            success: true,
                            user: sessionUser,
                            message: 'Signed in successfully'
                        };
                    }
                } catch (memberstackError) {
                    console.error('Memberstack sign in failed:', memberstackError);
                    throw new Error('Invalid email or password');
                }
            } else {
                // Fallback to mock authentication
                console.log('Using mock authentication (Memberstack not available)');
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const user = this.mockUsers.find(u => u.email === email && u.password === password);
                
                if (!user) {
                    throw new Error('Invalid email or password');
                }
                
                const sessionUser = {
                    id: user.id,
                    memberId: user.memberId,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    signedInAt: new Date().toISOString()
                };
                
                this.saveCurrentUser(sessionUser);
                
                return {
                    success: true,
                    user: sessionUser,
                    message: 'Signed in successfully (mock)'
                };
            }
            
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Sign up new user (Memberstack + fallback)
    async signUp(userData) {
        try {
            // Validate passwords match
            if (userData.password !== userData.confirmPassword) {
                throw new Error('Passwords do not match');
            }
            
            // Try Memberstack first
            if (this.isInitialized && this.memberstack) {
                try {
                    const member = await this.memberstack.signUp({
                        email: userData.email,
                        password: userData.password,
                        customFields: {
                            name: userData.name,
                            role: userData.role
                        }
                    });
                    
                    if (member) {
                        const sessionUser = {
                            id: member.id,
                            memberId: member.id,
                            email: member.email,
                            name: userData.name,
                            role: userData.role,
                            signedInAt: new Date().toISOString()
                        };
                        
                        this.saveCurrentUser(sessionUser);
                        
                        return {
                            success: true,
                            user: sessionUser,
                            message: 'Account created successfully'
                        };
                    }
                } catch (memberstackError) {
                    console.error('Memberstack sign up failed:', memberstackError);
                    if (memberstackError.message?.includes('email')) {
                        throw new Error('An account with this email already exists');
                    }
                    throw new Error('Failed to create account. Please try again.');
                }
            } else {
                // Fallback to mock authentication
                console.log('Using mock sign up (Memberstack not available)');
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Check if email already exists
                const existingUser = this.mockUsers.find(u => u.email === userData.email);
                if (existingUser) {
                    throw new Error('An account with this email already exists');
                }
                
                // Create new user
                const newUser = {
                    id: `user_${Date.now()}`,
                    memberId: `mem_${Math.random().toString(36).substr(2, 9)}`,
                    email: userData.email,
                    password: userData.password,
                    name: userData.name,
                    role: userData.role,
                    createdAt: new Date().toISOString()
                };
                
                // Add to mock users array
                this.mockUsers.push(newUser);
                
                // Create session data (excluding password)
                const sessionUser = {
                    id: newUser.id,
                    memberId: newUser.memberId,
                    email: newUser.email,
                    name: newUser.name,
                    role: newUser.role,
                    signedInAt: new Date().toISOString()
                };
                
                this.saveCurrentUser(sessionUser);
                
                return {
                    success: true,
                    user: sessionUser,
                    message: 'Account created successfully (mock)'
                };
            }
            
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Sign out
    async signOut() {
        try {
            // Try Memberstack sign out first
            if (this.isInitialized && this.memberstack) {
                await this.memberstack.signOut();
            }
        } catch (error) {
            console.error('Memberstack sign out error:', error);
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
}

// Global auth service instance
const authService = new AuthService();

// UI Functions for switching between sign in and sign up
function showSignIn() {
    document.getElementById('signin-form').classList.remove('hidden');
    document.getElementById('signup-form').classList.add('hidden');
    clearMessages();
}

function showSignUp() {
    document.getElementById('signin-form').classList.add('hidden');
    document.getElementById('signup-form').classList.remove('hidden');
    clearMessages();
}

function clearMessages() {
    // Clear error messages
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(el => el.style.display = 'none');
    
    // Clear success messages
    const successElements = document.querySelectorAll('.success-message');
    successElements.forEach(el => el.style.display = 'none');
}

function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

function showSuccess(elementId, message) {
    const successEl = document.getElementById(elementId);
    successEl.textContent = message;
    successEl.style.display = 'block';
}

function setLoading(buttonId, loading) {
    const btn = document.getElementById(buttonId);
    if (loading) {
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span>Signing in...';
    } else {
        btn.disabled = false;
        btn.innerHTML = btn.id.includes('signin') ? 'Sign In' : 'Create Account';
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Redirect to dashboard if already authenticated
    authService.redirectToDashboard();
    
    // Sign In Form
    document.getElementById('signinForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessages();
        
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        
        setLoading('signin-btn', true);
        
        const result = await authService.signIn(email, password);
        
        setLoading('signin-btn', false);
        
        if (result.success) {
            showSuccess('auth-success', result.message);
            // Redirect to dashboard after successful sign in
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showError('auth-error', result.message);
        }
    });
    
    // Sign Up Form
    document.getElementById('signupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessages();
        
        const formData = new FormData(e.target);
        const userData = {
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword'),
            role: formData.get('role')
        };
        
        setLoading('signup-btn', true);
        
        const result = await authService.signUp(userData);
        
        setLoading('signup-btn', false);
        
        if (result.success) {
            showSuccess('signup-success', result.message);
            // Redirect to dashboard after successful sign up
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            showError('signup-error', result.message);
        }
    });
    
    // Demo credential click to fill forms
    document.querySelectorAll('.demo-credential').forEach(el => {
        el.style.cursor = 'pointer';
        el.title = 'Click to fill form';
        
        el.addEventListener('click', (e) => {
            const credential = e.target.textContent;
            
            if (credential.includes('@')) {
                // Email credential
                const emailInput = document.querySelector('#signin-form:not(.hidden) input[type="email"]');
                if (emailInput) emailInput.value = credential;
            } else if (credential.includes('password')) {
                // Password credential
                const passwordInput = document.querySelector('#signin-form:not(.hidden) input[type="password"]');
                if (passwordInput) passwordInput.value = credential;
            }
        });
    });
});

// Make auth service globally available
window.authService = authService;