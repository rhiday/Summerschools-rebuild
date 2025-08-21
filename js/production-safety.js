// Production Safety & Monitoring System
// Prevents authentication failures and provides fallback mechanisms

class ProductionSafetyManager {
    constructor() {
        this.healthChecks = [];
        this.fallbackStrategies = [];
        this.monitoring = {
            errors: [],
            warnings: [],
            performance: []
        };
        
        this.init();
    }
    
    init() {
        console.log('🛡️ Production Safety Manager initialized');
        this.setupErrorHandling();
        this.setupHealthMonitoring();
        this.setupPerformanceTracking();
    }
    
    // ERROR HANDLING & RECOVERY
    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.logError('Script Error', {
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                column: event.colno,
                stack: event.error?.stack
            });
        });
        
        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Unhandled Promise Rejection', {
                reason: event.reason,
                stack: event.reason?.stack
            });
        });
        
        // Network error detection
        this.setupNetworkMonitoring();
    }
    
    setupNetworkMonitoring() {
        const originalFetch = window.fetch;
        
        window.fetch = async function(...args) {
            const startTime = performance.now();
            
            try {
                const response = await originalFetch.apply(this, args);
                const endTime = performance.now();
                
                // Log slow requests
                if (endTime - startTime > 5000) {
                    window.safetyManager?.logWarning('Slow Network Request', {
                        url: args[0],
                        duration: endTime - startTime,
                        status: response.status
                    });
                }
                
                // Log failed requests
                if (!response.ok) {
                    window.safetyManager?.logError('Network Request Failed', {
                        url: args[0],
                        status: response.status,
                        statusText: response.statusText
                    });
                }
                
                return response;
            } catch (error) {
                window.safetyManager?.logError('Network Error', {
                    url: args[0],
                    error: error.message,
                    stack: error.stack
                });
                throw error;
            }
        };
    }
    
    // HEALTH MONITORING
    setupHealthMonitoring() {
        // Check critical services every 30 seconds
        setInterval(() => {
            this.runHealthChecks();
        }, 30000);
        
        // Initial health check
        setTimeout(() => this.runHealthChecks(), 2000);
    }
    
    registerHealthCheck(name, checkFunction, criticalLevel = 'medium') {
        this.healthChecks.push({
            name,
            check: checkFunction,
            critical: criticalLevel,
            lastCheck: null,
            lastResult: null
        });
    }
    
    async runHealthChecks() {
        console.log('🏥 Running health checks...');
        
        for (const healthCheck of this.healthChecks) {
            try {
                const result = await healthCheck.check();
                healthCheck.lastCheck = new Date();
                healthCheck.lastResult = result;
                
                if (!result.healthy) {
                    this.logWarning(`Health Check Failed: ${healthCheck.name}`, result);
                    
                    if (healthCheck.critical === 'high') {
                        this.triggerEmergencyFallback(healthCheck.name, result);
                    }
                }
            } catch (error) {
                this.logError(`Health Check Error: ${healthCheck.name}`, error);
            }
        }
    }
    
    // FALLBACK STRATEGIES
    registerFallbackStrategy(trigger, strategy) {
        this.fallbackStrategies.push({ trigger, strategy });
    }
    
    async triggerEmergencyFallback(reason, details) {
        console.warn('🚨 Emergency fallback triggered:', reason);
        
        for (const fallback of this.fallbackStrategies) {
            if (fallback.trigger === reason || fallback.trigger === 'any') {
                try {
                    await fallback.strategy(details);
                    this.logInfo(`Fallback executed: ${reason}`, details);
                } catch (error) {
                    this.logError(`Fallback failed: ${reason}`, error);
                }
            }
        }
    }
    
    // PERFORMANCE TRACKING
    setupPerformanceTracking() {
        // Track page load performance
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            
            this.logPerformance('Page Load', {
                loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0
            });
        });
    }
    
    // LOGGING & MONITORING
    logError(type, details) {
        const errorEntry = {
            type,
            details,
            timestamp: new Date(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        this.monitoring.errors.push(errorEntry);
        console.error(`❌ ${type}:`, details);
        
        // Send to monitoring service if available
        this.sendToMonitoringService('error', errorEntry);
    }
    
    logWarning(type, details) {
        const warningEntry = {
            type,
            details,
            timestamp: new Date(),
            url: window.location.href
        };
        
        this.monitoring.warnings.push(warningEntry);
        console.warn(`⚠️ ${type}:`, details);
        
        this.sendToMonitoringService('warning', warningEntry);
    }
    
    logInfo(type, details) {
        console.log(`ℹ️ ${type}:`, details);
    }
    
    logPerformance(type, metrics) {
        const perfEntry = {
            type,
            metrics,
            timestamp: new Date()
        };
        
        this.monitoring.performance.push(perfEntry);
        console.log(`📊 ${type}:`, metrics);
    }
    
    sendToMonitoringService(level, data) {
        // Send to external monitoring service (Sentry, LogRocket, etc.)
        if (window.Sentry) {
            if (level === 'error') {
                window.Sentry.captureException(new Error(data.type), {
                    extra: data.details
                });
            } else {
                window.Sentry.captureMessage(`${data.type}: ${JSON.stringify(data.details)}`, level);
            }
        }
        
        // Send to custom analytics endpoint
        if (typeof window.gtag !== 'undefined') {
            window.gtag('event', 'safety_event', {
                event_category: level,
                event_label: data.type,
                custom_map: { custom_data: JSON.stringify(data.details) }
            });
        }
    }
    
    // PUBLIC API
    getHealthReport() {
        return {
            errors: this.monitoring.errors.slice(-10), // Last 10 errors
            warnings: this.monitoring.warnings.slice(-10), // Last 10 warnings
            performance: this.monitoring.performance.slice(-5), // Last 5 performance metrics
            healthChecks: this.healthChecks.map(check => ({
                name: check.name,
                lastCheck: check.lastCheck,
                healthy: check.lastResult?.healthy || false,
                critical: check.critical
            }))
        };
    }
    
    isSystemHealthy() {
        const criticalFailures = this.healthChecks.filter(check => 
            check.critical === 'high' && 
            check.lastResult && 
            !check.lastResult.healthy
        );
        
        return criticalFailures.length === 0;
    }
    
    enableDebugMode() {
        window.safetyDebug = true;
        console.log('🔍 Safety debug mode enabled');
        
        // More verbose logging
        const originalLog = console.log;
        console.log = function(...args) {
            originalLog.apply(console, ['[DEBUG]', new Date().toISOString(), ...args]);
        };
    }
}

// Authentication-specific safety measures
class AuthSafetyChecks {
    static setupAuthHealthChecks(safetyManager) {
        // Check if auth system is loaded
        safetyManager.registerHealthCheck('auth_system_loaded', async () => {
            const hasEnvironmentAuth = typeof window.environmentAuth !== 'undefined';
            const hasLocalAuth = typeof window.localAuth !== 'undefined';
            
            return {
                healthy: hasEnvironmentAuth || hasLocalAuth,
                details: { hasEnvironmentAuth, hasLocalAuth }
            };
        }, 'high');
        
        // Check if user can authenticate
        safetyManager.registerHealthCheck('auth_functionality', async () => {
            if (window.environmentAuth) {
                const envInfo = window.environmentAuth.getEnvironmentInfo();
                const canAuth = window.environmentAuth.getCurrentUser() !== null || 
                              window.location.pathname.includes('auth');
                
                return {
                    healthy: canAuth || window.location.pathname.includes('auth'),
                    details: { envInfo, canAuth, currentPath: window.location.pathname }
                };
            }
            
            return { healthy: true, details: { reason: 'auth_check_skipped' } };
        }, 'medium');
        
        // Check API endpoints
        safetyManager.registerHealthCheck('api_endpoints', async () => {
            try {
                const response = await fetch('/api/webflow-courses?healthcheck=true');
                return {
                    healthy: response.status !== 404,
                    details: { status: response.status, available: response.status !== 404 }
                };
            } catch (error) {
                return {
                    healthy: false,
                    details: { error: error.message, reason: 'api_unavailable' }
                };
            }
        }, 'low');
    }
    
    static setupAuthFallbacks(safetyManager) {
        // Fallback for auth system failure
        safetyManager.registerFallbackStrategy('auth_system_loaded', async (details) => {
            if (!details.hasEnvironmentAuth && !details.hasLocalAuth) {
                console.warn('🚨 Auth system completely failed, implementing emergency auth');
                
                // Create emergency local auth
                window.emergencyAuth = {
                    getCurrentUser: () => JSON.parse(localStorage.getItem('emergencyAuth') || 'null'),
                    signIn: (email, password) => {
                        if (password === 'emergency123') {
                            const user = { id: 'emergency', email, source: 'emergency' };
                            localStorage.setItem('emergencyAuth', JSON.stringify(user));
                            return { success: true, data: user };
                        }
                        return { success: false, error: 'Emergency auth failed' };
                    },
                    signOut: () => localStorage.removeItem('emergencyAuth')
                };
                
                // Show emergency notice
                const notice = document.createElement('div');
                notice.innerHTML = `
                    <div style="position: fixed; top: 0; left: 0; right: 0; background: #dc3545; color: white; padding: 10px; text-align: center; z-index: 9999;">
                        🚨 Authentication system temporarily unavailable. Using emergency mode.
                        <br>Use password "emergency123" with any email to continue.
                    </div>
                `;
                document.body.prepend(notice);
            }
        });
        
        // Fallback for API unavailability
        safetyManager.registerFallbackStrategy('api_endpoints', async (details) => {
            console.warn('🚨 API endpoints unavailable, enabling offline mode');
            
            // Show offline notice
            const notice = document.createElement('div');
            notice.innerHTML = `
                <div style="position: fixed; bottom: 20px; right: 20px; background: #ffc107; color: #212529; padding: 15px; border-radius: 8px; z-index: 9999; max-width: 300px;">
                    ⚠️ Server temporarily unavailable. Working in offline mode with limited functionality.
                </div>
            `;
            document.body.appendChild(notice);
        });
    }
}

// Initialize safety system
window.safetyManager = new ProductionSafetyManager();

// Setup auth-specific safety measures
AuthSafetyChecks.setupAuthHealthChecks(window.safetyManager);
AuthSafetyChecks.setupAuthFallbacks(window.safetyManager);

console.log('🛡️ Production safety system initialized');

// Export for external use
window.ProductionSafetyManager = ProductionSafetyManager;
window.AuthSafetyChecks = AuthSafetyChecks;