// Webflow Provider CMS Sync Module (API v2)
// Handles all interactions between the provider form and Webflow Provider CMS

class WebflowProviderSync {
    constructor() {
        // Use relative URL for Vercel deployment
        this.apiEndpoint = '/api/webflow-providers';
        this.providers = [];
        this.currentEditingId = null;
    }

    // Initialize and load providers from Webflow
    async init() {
        try {
            await this.loadProviders();
            this.setupEventListeners();
            this.startStatusPolling(); // Check for status updates
        } catch (error) {
            console.error('Failed to initialize Webflow provider sync:', error);
        }
    }

    // Poll for status changes every 30 seconds
    startStatusPolling() {
        setInterval(async () => {
            try {
                await this.loadProviders();
            } catch (error) {
                console.log('Provider status polling error:', error);
            }
        }, 30000); // 30 seconds
    }

    // Manual refresh function for user-triggered updates
    async refreshProviders() {
        try {
            console.log('Refreshing providers...');
            await this.loadProviders();
            return true;
        } catch (error) {
            console.error('Failed to refresh providers:', error);
            return false;
        }
    }

    // Load all providers from Webflow CMS
    async loadProviders() {
        try {
            const response = await fetch(this.apiEndpoint + '?action=LIST');
            const result = await response.json();
            
            if (result.success) {
                this.providers = result.data;
                this.updateLocalProviders();
            }
        } catch (error) {
            console.error('Failed to load providers:', error);
        }
    }

    // Update local provider display with Webflow data (API v2 format)
    updateLocalProviders() {
        // Map Webflow providers to local format
        const localProviders = this.providers.map(item => {
            const fieldData = item.fieldData || {};
            
            return {
                id: item.id || item._id,
                webflowId: item.id || item._id,
                name: fieldData.name || 'Untitled Provider',
                description: fieldData['company-description'] || '',
                detailedDescription: fieldData['company-desc-2'] || '',
                foundedYear: fieldData['founded-year-2'] || '',
                accommodation: fieldData.accomodation || '',
                courseDate: fieldData['date-2'] || '',
                duration: fieldData['duration-2'] || '',
                ageRange: fieldData['age-range'] || '',
                fees: fieldData['fees-2'] || '',
                // Map Webflow status to display status
                status: fieldData._archived ? 'Archived' : (item.isDraft ? 'In Review' : 'Published'),
                archived: fieldData._archived || false,
                // Add additional fields for debugging
                isDraft: item.isDraft,
                lastUpdated: item.lastUpdated,
                lastPublished: item.lastPublished
            };
        });

        // Update the providers array in the main application
        if (window.providers) {
            // Include both draft and published providers (not archived)
            window.providers = localProviders.filter(p => !p.archived);
            window.archivedProviders = localProviders.filter(p => p.archived);
            
            // Separate by status for better organization
            window.draftProviders = localProviders.filter(p => !p.archived && p.isDraft);
            window.publishedProviders = localProviders.filter(p => !p.archived && !p.isDraft);
            
            console.log('Providers loaded:', {
                total: localProviders.length,
                draft: window.draftProviders.length,
                published: window.publishedProviders.length,
                archived: window.archivedProviders.length
            });
            
            // Re-render providers if function exists
            if (window.renderProviders) window.renderProviders();
        }
    }

    // Create a new provider in Webflow
    async createProvider(formData) {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'CREATE',
                    ...formData
                })
            });

            const result = await response.json();
            
            if (result.success) {
                await this.loadProviders(); // Reload providers
                return result;
            } else {
                throw new Error(result.message || 'Failed to create provider');
            }
        } catch (error) {
            console.error('Failed to create provider:', error);
            throw error;
        }
    }

    // Update an existing provider in Webflow
    async updateProvider(providerId, formData) {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'UPDATE',
                    providerId: providerId,
                    ...formData
                })
            });

            const result = await response.json();
            
            if (result.success) {
                await this.loadProviders(); // Reload providers
                return result;
            } else {
                throw new Error(result.message || 'Failed to update provider');
            }
        } catch (error) {
            console.error('Failed to update provider:', error);
            throw error;
        }
    }

    // Delete a provider from Webflow
    async deleteProvider(providerId) {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'DELETE',
                    providerId: providerId
                })
            });

            const result = await response.json();
            
            if (result.success) {
                await this.loadProviders(); // Reload providers
                return result;
            } else {
                throw new Error(result.message || 'Failed to delete provider');
            }
        } catch (error) {
            console.error('Failed to delete provider:', error);
            throw error;
        }
    }

    // Archive a provider (update with archived status in Webflow)
    async archiveProvider(providerId) {
        try {
            console.log('Archiving provider:', providerId);

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'ARCHIVE',
                    providerId: providerId
                })
            });

            const result = await response.json();
            
            if (result.success) {
                await this.loadProviders(); // Reload providers
                return result;
            } else {
                throw new Error(result.message || 'Failed to archive provider');
            }
        } catch (error) {
            console.error('Failed to archive provider:', error);
            throw error;
        }
    }

    // Setup event listeners for provider actions
    setupEventListeners() {
        // Override the provider form submission
        const originalProviderForm = document.getElementById('providerForm');
        if (originalProviderForm) {
            // Auto-fill memberId if user is authenticated
            this.autoFillMemberId();
            
            originalProviderForm.addEventListener('submit', async (e) => {
                e.preventDefault(); // Prevent default form submission
                
                // Get form data (keep as FormData for file uploads)
                const formData = new FormData(originalProviderForm);
                
                // Add action to FormData
                formData.append('action', this.currentEditingId ? 'UPDATE' : 'CREATE');
                if (this.currentEditingId) {
                    formData.append('providerId', this.currentEditingId);
                }

                console.log('Provider form being submitted with files');

                try {
                    // Show loading state
                    const submitBtn = originalProviderForm.querySelector('button[type="submit"]');
                    if (submitBtn) {
                        submitBtn.disabled = true;
                        submitBtn.textContent = 'Submitting...';
                    }

                    // Submit form data with files
                    const response = await fetch(this.apiEndpoint, {
                        method: 'POST',
                        body: formData // Don't set Content-Type header, let browser set it
                    });

                    const result = await response.json();
                    
                    if (!result.success) {
                        throw new Error(result.message || 'Failed to save provider');
                    }
                    
                    // Clear editing state
                    this.currentEditingId = null;
                    
                    console.log('Provider submission successful:', result);
                    
                    // Show success message
                    alert('Provider information saved successfully!');
                    
                    // Reset form
                    originalProviderForm.reset();
                    
                } catch (error) {
                    console.error('Error submitting provider to Webflow:', error);
                    alert('There was an error saving your provider information. Please try again or contact support.');
                } finally {
                    // Reset button state
                    const submitBtn = originalProviderForm.querySelector('button[type="submit"]');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Save Provider';
                    }
                }
            });
        }

        // Global provider management functions
        window.editProvider = async (providerId) => {
            const provider = this.providers.find(p => (p.id || p._id) === providerId);
            if (!provider) return;
            
            this.currentEditingId = providerId;
            
            // Pre-fill the form with provider data
            const fieldData = provider.fieldData || {};
            
            // Map Webflow fields back to form fields
            const fieldMappings = {
                'School-name': fieldData.name,
                'Short-bio': fieldData['company-description'],
                'Details-school-bio': fieldData['company-desc-2'],
                'Year-founded': fieldData['founded-year-2'],
                'Accomodation-type': fieldData.accomodation,
                'Course-Date': fieldData['date-2'],
                'Courses-duration': fieldData['duration-2'],
                'Age-Range': fieldData['age-range'],
                'Fees-from': fieldData['fees-2']
            };

            // Fill form fields
            Object.entries(fieldMappings).forEach(([formFieldId, value]) => {
                const field = document.getElementById(formFieldId);
                if (field && value) {
                    field.value = value;
                }
            });
            
            // Show the provider form
            if (window.showProviderView) window.showProviderView();
        };

        window.archiveProvider = async (providerId) => {
            if (confirm('Are you sure you want to archive this provider?')) {
                try {
                    await this.archiveProvider(providerId);
                    alert('Provider archived successfully!');
                } catch (error) {
                    alert('Failed to archive provider: ' + error.message);
                }
            }
        };

        window.deleteProvider = async (providerId) => {
            if (confirm('Are you sure you want to permanently delete this provider? This action cannot be undone.')) {
                try {
                    await this.deleteProvider(providerId);
                    alert('Provider deleted permanently!');
                } catch (error) {
                    alert('Failed to delete provider: ' + error.message);
                }
            }
        };
    }

    // Auto-fill memberId from authentication
    autoFillMemberId() {
        const memberIdField = document.getElementById('Member-ID');
        if (memberIdField && window.authService) {
            const user = window.authService.getCurrentUser();
            if (user && user.memberId) {
                memberIdField.value = user.memberId;
            }
        }
    }
}

// Refresh provider status function
async function refreshProviderStatus() {
    if (window.webflowProviderSync) {
        const success = await window.webflowProviderSync.refreshProviders();
        if (success) {
            console.log('Provider status refreshed successfully');
        }
    }
}

// Initialize Webflow provider sync when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const webflowProviderSync = new WebflowProviderSync();
    webflowProviderSync.init();
    
    // Make it globally accessible
    window.webflowProviderSync = webflowProviderSync;
});