// Authentication Service with Memberstack Integration
// This connects to Memberstack for user authentication and management

class AuthService {
    constructor() {
        this.memberstack = null;
        this.currentUser = null;
        this.isInitialized = false;
        this.initializationAttempts = 0;
        this.maxAttempts = 10;
        
        this.initializeMemberstack();
        this.loadCurrentUser();
    }

    // Initialize Memberstack
    async initializeMemberstack() {
        try {
            this.initializationAttempts++;
            
            // Check for Memberstack 2.0 (auto-initialized)
            if (typeof window !== 'undefined' && window.memberstack) {
                this.memberstack = window.memberstack;
                this.isInitialized = true;
                console.log('✅ Memberstack 2.0 detected and ready');
                
                // Check if user is already signed in
                await this.checkExistingSession();
            }
            // Check for initialized $memberstackDom
            else if (typeof window !== 'undefined' && window.$memberstackDom) {
                this.memberstack = window.$memberstackDom;
                this.isInitialized = true;
                console.log('✅ Using initialized $memberstackDom');
                
                // Check if user is already signed in
                await this.checkExistingSession();
            }
            // Try to initialize Memberstack 1.0
            else if (typeof window !== 'undefined' && window.MemberStack) {
                console.log('Initializing Memberstack 1.0...');
                try {
                    window.$memberstackDom = window.MemberStack.init({
                        publicKey: 'pk_4f1166cfc3dc4380712e'
                    });
                    this.memberstack = window.$memberstackDom;
                    this.isInitialized = true;
                    console.log('✅ Memberstack 1.0 initialized');
                    await this.checkExistingSession();
                } catch (initError) {
                    console.error('Memberstack init error:', initError);
                    setTimeout(() => this.initializeMemberstack(), 500);
                }
            }
            // Retry if not ready yet
            else if (this.initializationAttempts < this.maxAttempts) {
                console.log(`Waiting for Memberstack... (attempt ${this.initializationAttempts}/${this.maxAttempts})`);
                setTimeout(() => this.initializeMemberstack(), 500);
            } else {
                console.error('❌ Failed to initialize Memberstack after maximum attempts');
                this.isInitialized = false;
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

    // Sign in with email and password (Memberstack only)
    async signIn(email, password) {
        try {
            // Wait for Memberstack to initialize if needed
            let waitCount = 0;
            while (!this.isInitialized && waitCount < 10) {
                console.log('Waiting for Memberstack to initialize...');
                await new Promise(resolve => setTimeout(resolve, 500));
                waitCount++;
            }
            
            if (!this.isInitialized || !this.memberstack) {
                throw new Error('Memberstack is not initialized. Please refresh the page and try again.');
            }
            
            console.log('🔐 Attempting Memberstack sign in for:', email);
            
            try {
                const response = await this.memberstack.signIn({
                    email: email,
                    password: password
                });
                
                console.log('Memberstack sign in response:', response);
                
                // Extract member data from response
                const member = response.data || response.member || response;
                
                if (member && member.id) {
                    const sessionUser = {
                        id: member.id,
                        memberId: member.id,
                        email: member.auth?.email || member.email || email,
                        name: member.customFields?.name || member.metadata?.name || email.split('@')[0],
                        role: member.planConnections?.[0]?.planId || 'provider',
                        signedInAt: new Date().toISOString()
                    };
                    
                    console.log('✅ Sign in successful:', sessionUser);
                    this.saveCurrentUser(sessionUser);
                    
                    return {
                        success: true,
                        user: sessionUser,
                        message: 'Signed in successfully'
                    };
                } else {
                    throw new Error('Invalid response from Memberstack');
                }
            } catch (memberstackError) {
                console.error('❌ Memberstack sign in error:', memberstackError);
                
                // Parse error message
                let errorMessage = 'Invalid email or password';
                if (memberstackError.message) {
                    if (memberstackError.message.includes('password')) {
                        errorMessage = 'Incorrect password';
                    } else if (memberstackError.message.includes('email')) {
                        errorMessage = 'Email not found';
                    } else if (memberstackError.message.includes('network')) {
                        errorMessage = 'Network error. Please check your connection.';
                    } else {
                        errorMessage = memberstackError.message;
                    }
                }
                
                throw new Error(errorMessage);
            }
            
        } catch (error) {
            console.error('Sign in error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Sign up new user (Memberstack only)
    async signUp(userData) {
        try {
            // Validate passwords match
            if (userData.password !== userData.confirmPassword) {
                throw new Error('Passwords do not match');
            }
            
            // Wait for Memberstack to initialize if needed
            let waitCount = 0;
            while (!this.isInitialized && waitCount < 10) {
                console.log('Waiting for Memberstack to initialize...');
                await new Promise(resolve => setTimeout(resolve, 500));
                waitCount++;
            }
            
            if (!this.isInitialized || !this.memberstack) {
                throw new Error('Memberstack is not initialized. Please refresh the page and try again.');
            }
            
            console.log('📝 Creating Memberstack account for:', userData.email);
            
            try {
                const response = await this.memberstack.signUp({
                    email: userData.email,
                    password: userData.password,
                    metadata: {
                        name: userData.name,
                        role: userData.role
                    }
                });
                
                console.log('Memberstack sign up response:', response);
                
                // Extract member data from response
                const member = response.data || response.member || response;
                
                if (member && member.id) {
                    const sessionUser = {
                        id: member.id,
                        memberId: member.id,
                        email: member.auth?.email || member.email || userData.email,
                        name: userData.name,
                        role: userData.role,
                        signedInAt: new Date().toISOString()
                    };
                    
                    console.log('✅ Account created successfully:', sessionUser);
                    this.saveCurrentUser(sessionUser);
                    
                    return {
                        success: true,
                        user: sessionUser,
                        message: 'Account created successfully'
                    };
                } else {
                    throw new Error('Invalid response from Memberstack');
                }
            } catch (memberstackError) {
                console.error('❌ Memberstack sign up error:', memberstackError);
                
                let errorMessage = 'Failed to create account';
                if (memberstackError.message) {
                    if (memberstackError.message.includes('already')) {
                        errorMessage = 'An account with this email already exists';
                    } else if (memberstackError.message.includes('password')) {
                        errorMessage = 'Password does not meet requirements';
                    } else {
                        errorMessage = memberstackError.message;
                    }
                }
                
                throw new Error(errorMessage);
            }
            
        } catch (error) {
            console.error('Sign up error:', error);
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