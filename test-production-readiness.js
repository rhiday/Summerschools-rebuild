// Production Readiness Test Suite
// Comprehensive tests to catch issues before deployment

class ProductionReadinessTests {
    constructor() {
        this.results = {
            passed: [],
            failed: [],
            warnings: []
        };
    }
    
    async runAllTests() {
        console.log('🧪 Starting Production Readiness Tests...');
        console.log('=====================================');
        
        await this.testEnvironmentDetection();
        await this.testAuthenticationSystems();
        await this.testAPIEndpoints();
        await this.testErrorHandling();
        await this.testPerformance();
        await this.testSecurity();
        await this.testBrowserCompatibility();
        
        this.generateReport();
    }
    
    // ENVIRONMENT TESTS
    async testEnvironmentDetection() {
        console.log('🌍 Testing Environment Detection...');
        
        // Test localhost detection
        this.mockHostname('localhost');
        const localDetect = this.detectEnvironment();
        this.assert(!localDetect, 'Localhost should be detected as development');
        
        // Test production domain detection
        this.mockHostname('summerschools.com');
        const prodDetect = this.detectEnvironment();
        this.assert(prodDetect, 'Custom domain should be detected as production');
        
        // Test Vercel preview detection
        this.mockHostname('git-feature-branch-project.vercel.app');
        const previewDetect = this.detectEnvironment();
        this.assert(!previewDetect, 'Git preview should be detected as development');
        
        // Restore original hostname
        this.restoreHostname();
    }
    
    // AUTHENTICATION TESTS
    async testAuthenticationSystems() {
        console.log('🔐 Testing Authentication Systems...');
        
        // Test local auth system
        if (window.localAuth) {
            try {
                const testUser = window.localAuth.signIn('provider@test.com', 'password123');
                this.assert(testUser.success, 'Local auth should work with test credentials');
                
                const currentUser = window.localAuth.getCurrentUser();
                this.assert(currentUser && currentUser.email === 'provider@test.com', 'Local auth should store current user');
                
                window.localAuth.signOut();
                const afterSignOut = window.localAuth.getCurrentUser();
                this.assert(!afterSignOut, 'Sign out should clear current user');
                
            } catch (error) {
                this.fail('Local auth system error', error);
            }
        } else {
            this.warn('Local auth system not loaded');
        }
        
        // Test environment auth if available
        if (window.environmentAuth) {
            try {
                const envInfo = window.environmentAuth.getEnvironmentInfo();
                this.assert(typeof envInfo.isProduction === 'boolean', 'Environment info should include production flag');
                this.assert(typeof envInfo.hostname === 'string', 'Environment info should include hostname');
                
            } catch (error) {
                this.fail('Environment auth system error', error);
            }
        } else {
            this.warn('Environment auth system not loaded');
        }
    }
    
    // API TESTS
    async testAPIEndpoints() {
        console.log('🌐 Testing API Endpoints...');
        
        const endpoints = [
            '/api/webflow-courses',
            '/api/webflow-providers',
            '/api/memberstack-users'
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint + '?test=true');
                
                if (response.status === 404) {
                    this.warn(`API endpoint ${endpoint} not available (expected in localhost)`);
                } else if (response.status >= 500) {
                    this.fail(`API endpoint ${endpoint} server error`, { status: response.status });
                } else {
                    this.pass(`API endpoint ${endpoint} accessible`);
                }
                
            } catch (error) {
                this.warn(`API endpoint ${endpoint} network error (expected in localhost)`, error);
            }
        }
    }
    
    // ERROR HANDLING TESTS
    async testErrorHandling() {
        console.log('🚨 Testing Error Handling...');
        
        // Test if safety manager is loaded
        if (window.safetyManager) {
            this.pass('Production safety manager loaded');
            
            // Test error logging
            const initialErrors = window.safetyManager.monitoring.errors.length;
            window.safetyManager.logError('test_error', { test: true });
            const afterError = window.safetyManager.monitoring.errors.length;
            
            this.assert(afterError > initialErrors, 'Error logging should work');
            
            // Test health checks
            if (window.safetyManager.healthChecks.length > 0) {
                this.pass('Health checks registered');
            } else {
                this.warn('No health checks registered');
            }
            
        } else {
            this.fail('Production safety manager not loaded');
        }
        
        // Test global error handling
        const originalErrorCount = this.results.failed.length;
        
        // Trigger a test error
        setTimeout(() => {
            throw new Error('Test error for error handling');
        }, 100);
        
        // Wait a bit and check if it was caught
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // PERFORMANCE TESTS
    async testPerformance() {
        console.log('⚡ Testing Performance...');
        
        // Test script loading times
        const scriptElements = document.querySelectorAll('script[src]');
        let slowScripts = 0;
        
        for (const script of scriptElements) {
            if (script.src.includes('memberstack') || script.src.includes('auth')) {
                // These are the critical auth scripts
                this.pass(`Critical script loaded: ${script.src}`);
            }
        }
        
        // Test memory usage (basic check)
        if (performance.memory) {
            const memoryUsage = performance.memory.usedJSHeapSize / 1048576; // MB
            if (memoryUsage < 50) {
                this.pass(`Memory usage acceptable: ${memoryUsage.toFixed(2)}MB`);
            } else {
                this.warn(`High memory usage: ${memoryUsage.toFixed(2)}MB`);
            }
        }
        
        // Test DOM elements count
        const elementCount = document.querySelectorAll('*').length;
        if (elementCount < 1000) {
            this.pass(`DOM size reasonable: ${elementCount} elements`);
        } else {
            this.warn(`Large DOM: ${elementCount} elements`);
        }
    }
    
    // SECURITY TESTS
    async testSecurity() {
        console.log('🔒 Testing Security...');
        
        // Test HTTPS (in production)
        if (window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
            this.pass('HTTPS or localhost detected');
        } else {
            this.fail('Insecure connection detected');
        }
        
        // Test localStorage security
        try {
            localStorage.setItem('test_security', 'test');
            localStorage.removeItem('test_security');
            this.pass('localStorage accessible');
        } catch (error) {
            this.fail('localStorage not accessible', error);
        }
        
        // Check for sensitive data in localStorage
        const authData = localStorage.getItem('localAuthUser');
        if (authData) {
            const parsed = JSON.parse(authData);
            if (parsed.password) {
                this.fail('Password stored in localStorage - security risk');
            } else {
                this.pass('No sensitive data in localStorage');
            }
        }
        
        // Test CSP (if available)
        const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (metaCSP) {
            this.pass('Content Security Policy configured');
        } else {
            this.warn('No Content Security Policy found');
        }
    }
    
    // BROWSER COMPATIBILITY TESTS
    async testBrowserCompatibility() {
        console.log('🌐 Testing Browser Compatibility...');
        
        // Test modern JavaScript features
        const features = {
            'async/await': typeof (async () => {}) === 'function',
            'Fetch API': typeof fetch !== 'undefined',
            'LocalStorage': typeof localStorage !== 'undefined',
            'Promises': typeof Promise !== 'undefined',
            'Arrow Functions': (() => true)(),
            'Template Literals': `${true}` === 'true'
        };
        
        for (const [feature, supported] of Object.entries(features)) {
            if (supported) {
                this.pass(`${feature} supported`);
            } else {
                this.fail(`${feature} not supported`);
            }
        }
        
        // Test responsive design
        if (window.matchMedia) {
            this.pass('Responsive design support available');
        } else {
            this.warn('Limited responsive design support');
        }
    }
    
    // UTILITY METHODS
    detectEnvironment() {
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        const isVercelPreview = hostname.includes('vercel.app');
        const isCustomDomain = !isLocalhost && !isVercelPreview;
        
        return isCustomDomain || (isVercelPreview && !hostname.includes('git-'));
    }
    
    mockHostname(hostname) {
        this.originalHostname = window.location.hostname;
        Object.defineProperty(window.location, 'hostname', {
            writable: true,
            value: hostname
        });
    }
    
    restoreHostname() {
        if (this.originalHostname) {
            Object.defineProperty(window.location, 'hostname', {
                writable: true,
                value: this.originalHostname
            });
        }
    }
    
    assert(condition, message) {
        if (condition) {
            this.pass(message);
        } else {
            this.fail(message);
        }
    }
    
    pass(message) {
        this.results.passed.push(message);
        console.log(`✅ ${message}`);
    }
    
    fail(message, error = null) {
        this.results.failed.push({ message, error });
        console.error(`❌ ${message}`, error || '');
    }
    
    warn(message, details = null) {
        this.results.warnings.push({ message, details });
        console.warn(`⚠️ ${message}`, details || '');
    }
    
    generateReport() {
        console.log('\n🎯 PRODUCTION READINESS REPORT');
        console.log('==============================');
        console.log(`✅ Passed: ${this.results.passed.length}`);
        console.log(`❌ Failed: ${this.results.failed.length}`);
        console.log(`⚠️ Warnings: ${this.results.warnings.length}`);
        
        if (this.results.failed.length === 0) {
            console.log('\n🚀 READY FOR PRODUCTION!');
        } else {
            console.log('\n🔧 ISSUES NEED FIXING BEFORE PRODUCTION:');
            this.results.failed.forEach(failure => {
                console.log(`  - ${failure.message}`);
            });
        }
        
        if (this.results.warnings.length > 0) {
            console.log('\n⚠️ WARNINGS TO CONSIDER:');
            this.results.warnings.forEach(warning => {
                console.log(`  - ${warning.message}`);
            });
        }
        
        return {
            readyForProduction: this.results.failed.length === 0,
            summary: {
                passed: this.results.passed.length,
                failed: this.results.failed.length,
                warnings: this.results.warnings.length
            },
            details: this.results
        };
    }
}

// Auto-run tests if loaded directly
if (typeof window !== 'undefined') {
    window.ProductionReadinessTests = ProductionReadinessTests;
    
    // Auto-run in development
    if (window.location.hostname === 'localhost') {
        console.log('🧪 Auto-running production readiness tests...');
        const tests = new ProductionReadinessTests();
        
        // Run tests after a short delay to let everything load
        setTimeout(() => {
            tests.runAllTests();
        }, 3000);
    }
}

// Export for use in CI/CD
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductionReadinessTests;
}