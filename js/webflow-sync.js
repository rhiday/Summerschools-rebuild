// Webflow CMS Sync Module
// Handles all interactions between the form and Webflow CMS

class WebflowSync {
    constructor() {
        // Use relative URL for Vercel deployment
        this.apiEndpoint = '/api/webflow-courses';
        this.courses = [];
        this.currentEditingId = null;
    }

    // Initialize and load courses from Webflow
    async init() {
        try {
            await this.loadCourses();
            this.setupEventListeners();
            this.startStatusPolling(); // Check for status updates
        } catch (error) {
            console.error('Failed to initialize Webflow sync:', error);
        }
    }

    // Poll for status changes every 30 seconds
    startStatusPolling() {
        setInterval(async () => {
            try {
                await this.loadCourses();
            } catch (error) {
                console.log('Status polling error:', error);
            }
        }, 30000); // 30 seconds
    }

    // Manual refresh function for user-triggered updates
    async refreshCourses() {
        try {
            console.log('Refreshing courses...');
            await this.loadCourses();
            return true;
        } catch (error) {
            console.error('Failed to refresh courses:', error);
            return false;
        }
    }

    // Load all courses from Webflow CMS
    async loadCourses() {
        try {
            const response = await fetch(this.apiEndpoint + '?action=LIST');
            const result = await response.json();
            
            if (result.success) {
                this.courses = result.data;
                this.updateLocalCourses();
            }
        } catch (error) {
            console.error('Failed to load courses:', error);
        }
    }

    // Update local course display with Webflow data (API v2 format)
    updateLocalCourses() {
        // Map Webflow courses to local format
        const localCourses = this.courses.map(item => {
            const fieldData = item.fieldData || {};
            
            return {
                id: item.id || item._id,
                webflowId: item.id || item._id,
                title: fieldData.name || 'Untitled Course',
                description: fieldData.description || fieldData.summary || '',
                price: fieldData.fees ? `£${fieldData.fees}` : '£0',
                duration: fieldData.duration || '',
                dates: fieldData.dates || '',
                // Map Webflow status to display status with archive consideration
                status: fieldData._archived ? 'Archived' : (item.isDraft ? 'In Review' : 'Published'),
                emoji: '📚', // Default emoji
                archived: fieldData._archived || false,
                location: fieldData.destination || '',
                ageRange: fieldData.age || `${fieldData['minimum-age'] || 13}-${fieldData['maximum-age'] || 18}`,
                provider: fieldData.provider || '',
                // Add additional fields for debugging
                isDraft: item.isDraft,
                lastUpdated: item.lastUpdated,
                lastPublished: item.lastPublished
            };
        });

        // Update the courses array in the main application
        if (window.courses) {
            // Include both draft and published courses (not archived)
            window.courses = localCourses.filter(c => !c.archived);
            window.archivedCourses = localCourses.filter(c => c.archived);
            
            // Separate by status for better organization
            window.draftCourses = localCourses.filter(c => !c.archived && c.isDraft);
            window.publishedCourses = localCourses.filter(c => !c.archived && !c.isDraft);
            
            console.log('Courses loaded:', {
                total: localCourses.length,
                draft: window.draftCourses.length,
                published: window.publishedCourses.length,
                archived: window.archivedCourses.length
            });
            
            // Re-render courses
            if (window.renderActiveCourses) window.renderActiveCourses();
            if (window.renderArchivedCourses) window.renderArchivedCourses();
        }
    }

    // Format date for display
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
    }

    // Create a new course in Webflow
    async createCourse(formData) {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'CREATE',
                    ...this.mapFormToWebflow(formData)
                })
            });

            const result = await response.json();
            
            if (result.success) {
                await this.loadCourses(); // Reload courses
                return result;
            } else {
                throw new Error(result.message || 'Failed to create course');
            }
        } catch (error) {
            console.error('Failed to create course:', error);
            throw error;
        }
    }

    // Update an existing course in Webflow
    async updateCourse(courseId, formData) {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'UPDATE',
                    courseId: courseId,
                    ...this.mapFormToWebflow(formData)
                })
            });

            const result = await response.json();
            
            if (result.success) {
                await this.loadCourses(); // Reload courses
                return result;
            } else {
                throw new Error(result.message || 'Failed to update course');
            }
        } catch (error) {
            console.error('Failed to update course:', error);
            throw error;
        }
    }

    // Delete a course from Webflow
    async deleteCourse(courseId) {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'DELETE',
                    courseId: courseId
                })
            });

            const result = await response.json();
            
            if (result.success) {
                await this.loadCourses(); // Reload courses
                return result;
            } else {
                throw new Error(result.message || 'Failed to delete course');
            }
        } catch (error) {
            console.error('Failed to delete course:', error);
            throw error;
        }
    }

    // Duplicate a course in Webflow
    async duplicateCourse(courseId) {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'DUPLICATE',
                    courseId: courseId
                })
            });

            const result = await response.json();
            
            if (result.success) {
                await this.loadCourses(); // Reload courses
                return result;
            } else {
                throw new Error(result.message || 'Failed to duplicate course');
            }
        } catch (error) {
            console.error('Failed to duplicate course:', error);
            throw error;
        }
    }

    // Archive a course (update with archived status in Webflow)
    async archiveCourse(courseId) {
        try {
            // Get the course first using the correct ID format
            const course = this.courses.find(c => (c.id || c._id) === courseId);
            if (!course) throw new Error('Course not found');

            console.log('Archiving course:', courseId, course);

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'ARCHIVE',
                    courseId: courseId
                })
            });

            const result = await response.json();
            
            if (result.success) {
                await this.loadCourses(); // Reload courses
                return result;
            } else {
                throw new Error(result.message || 'Failed to archive course');
            }
        } catch (error) {
            console.error('Failed to archive course:', error);
            throw error;
        }
    }

    // Restore an archived course (unarchive in Webflow)
    async restoreCourse(courseId) {
        try {
            console.log('Restoring course:', courseId);

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'RESTORE',
                    courseId: courseId
                })
            });

            const result = await response.json();
            
            if (result.success) {
                await this.loadCourses(); // Reload courses
                return result;
            } else {
                throw new Error(result.message || 'Failed to restore course');
            }
        } catch (error) {
            console.error('Failed to restore course:', error);
            throw error;
        }
    }

    // Map form data to Webflow field structure
    mapFormToWebflow(formData) {
        return {
            'course-name': formData['course-name'] || formData.courseName,
            'course-details': formData['course-details'] || formData.courseDetails,
            'location': formData.location,
            'accommodation': formData.accommodation,
            'tuition': formData.tuition,
            'extra-activities': formData['extra-activities'] || formData.extraActivities,
            'course-fee': formData['course-fee'] || formData.courseFee,
            'course-duration': formData['course-duration'] || formData.courseDuration,
            'start-date': formData['start-date'] || formData.startDate,
            'end-date': formData['end-date'] || formData.endDate,
            'min-age': formData['min-age'] || formData.minAge,
            'max-age': formData['max-age'] || formData.maxAge,
            'contact-email': formData['contact-email'] || formData.contactEmail,
            'provider-link': formData['provider-link'] || formData.providerLink,
            'School-name': formData['School-name'] || formData.schoolName || formData.providerName
        };
    }

    // Setup event listeners for course actions
    setupEventListeners() {
        // Override the global functions to use Webflow sync
        window.editCourse = async (courseId) => {
            const course = this.courses.find(c => c._id === courseId);
            if (!course) return;
            
            this.currentEditingId = courseId;
            
            // Pre-fill the form with course data
            document.getElementById('course-name').value = course.fields.name;
            document.getElementById('course-details').value = course.fields['course-description'] || '';
            document.getElementById('location').value = course.fields.location || '';
            document.getElementById('accommodation').value = course.fields.accommodation || '';
            document.getElementById('tuition').value = course.fields['tuition-details'] || '';
            document.getElementById('extra-activities').value = course.fields['extra-activities'] || '';
            document.getElementById('course-fee').value = course.fields['course-fee'] || '';
            document.getElementById('course-duration').value = course.fields['course-duration'] || '';
            
            // Parse age range
            const ageRange = course.fields['age-range'] || '13-18';
            const [minAge, maxAge] = ageRange.split('-').map(a => parseInt(a));
            document.getElementById('min-age').value = minAge || 13;
            document.getElementById('max-age').value = maxAge || 18;
            
            // Parse dates
            if (course.fields['start-date']) {
                document.getElementById('start-date').value = course.fields['start-date'].split('T')[0];
            }
            if (course.fields['end-date']) {
                document.getElementById('end-date').value = course.fields['end-date'].split('T')[0];
            }
            
            document.getElementById('contact-email').value = course.fields['provider-email'] || '';
            document.getElementById('provider-link').value = course.fields['provider-link'] || '';
            
            // Show the course creation form
            if (window.startCourseCreation) window.startCourseCreation();
            
            // Update form title to indicate editing
            document.querySelector('.form-title').textContent = 'EDIT COURSE';
            document.querySelector('.form-subtitle').textContent = 'Update your course information below.';
        };

        window.duplicateCourse = async (courseId) => {
            if (confirm('Are you sure you want to duplicate this course?')) {
                try {
                    await this.duplicateCourse(courseId);
                    alert('Course duplicated successfully!');
                } catch (error) {
                    alert('Failed to duplicate course: ' + error.message);
                }
            }
        };

        window.archiveCourse = async (courseId) => {
            if (confirm('Are you sure you want to archive this course?')) {
                try {
                    await this.archiveCourse(courseId);
                    alert('Course archived successfully!');
                } catch (error) {
                    alert('Failed to archive course: ' + error.message);
                }
            }
        };

        window.restoreCourse = async (courseId) => {
            try {
                await this.restoreCourse(courseId);
                alert('Course restored successfully!');
            } catch (error) {
                alert('Failed to restore course: ' + error.message);
            }
        };

        window.deleteCourse = async (courseId) => {
            if (confirm('Are you sure you want to permanently delete this course? This action cannot be undone.')) {
                try {
                    await this.deleteCourse(courseId);
                    alert('Course deleted permanently!');
                } catch (error) {
                    alert('Failed to delete course: ' + error.message);
                }
            }
        };

        // Override the submit form function
        const originalSubmitForm = window.submitForm;
        window.submitForm = async () => {
            if (!window.validateCurrentStep()) {
                return;
            }

            // Get form data including rich text content
            const formData = new FormData(document.getElementById('multiStepForm'));
            const courseData = {};
            
            // Get regular form fields
            for (let [key, value] of formData.entries()) {
                courseData[key] = value;
            }

            // Get rich text content from contenteditable divs
            const richTextFields = document.querySelectorAll('.rich-text-content');
            richTextFields.forEach(field => {
                const fieldName = field.dataset.field;
                if (fieldName) {
                    courseData[fieldName] = field.innerHTML || '';
                }
            });

            console.log('Course data being submitted:', courseData);

            try {
                // Show loading state
                const submitBtn = document.getElementById('submitBtn');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Submitting...';

                let result;
                if (this.currentEditingId) {
                    // Update existing course
                    result = await this.updateCourse(this.currentEditingId, courseData);
                    this.currentEditingId = null;
                } else {
                    // Create new course
                    result = await this.createCourse(courseData);
                }
                
                console.log('Submission successful:', result);
                
                // Show success view
                document.querySelector('.form-header').style.display = 'none';
                document.querySelector('.step-progress').style.display = 'none';
                document.querySelector('#multiStepForm').style.display = 'none';
                document.querySelector('.form-navigation').style.display = 'none';
                document.getElementById('success-view').classList.add('active');
                
            } catch (error) {
                console.error('Error submitting to Webflow:', error);
                alert('There was an error submitting your course. Please try again or contact support.');
                
                // Reset button state
                const submitBtn = document.getElementById('submitBtn');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Application';
            }
        };
    }
}

// Refresh course status function
async function refreshCourseStatus() {
    const refreshBtn = document.getElementById('refresh-btn');
    refreshBtn.disabled = true;
    refreshBtn.textContent = '🔄 Refreshing...';
    
    try {
        if (window.webflowSync) {
            const success = await window.webflowSync.refreshCourses();
            if (success) {
                refreshBtn.textContent = '✅ Updated';
                setTimeout(() => {
                    refreshBtn.textContent = '🔄 Refresh Status';
                    refreshBtn.disabled = false;
                }, 2000);
            } else {
                throw new Error('Refresh failed');
            }
        }
    } catch (error) {
        refreshBtn.textContent = '❌ Error';
        setTimeout(() => {
            refreshBtn.textContent = '🔄 Refresh Status';
            refreshBtn.disabled = false;
        }, 2000);
    }
}

// Initialize Webflow sync when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const webflowSync = new WebflowSync();
    webflowSync.init();
    
    // Make it globally accessible
    window.webflowSync = webflowSync;
});