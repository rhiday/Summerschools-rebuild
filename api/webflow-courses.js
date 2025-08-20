// Vercel Serverless Function for Webflow CMS Integration (API v2)
// This handles all CRUD operations for courses in Webflow CMS
// Updated for Webflow API v2 (v1 was sunset January 1, 2025)

const WEBFLOW_API_TOKEN = process.env.WEBFLOW_API_TOKEN;
const COLLECTION_ID = process.env.WEBFLOW_COLLECTION_ID || '672bbb0fffd67079e532dfd9';
const SITE_ID = process.env.WEBFLOW_SITE_ID;

// Validate required environment variables
if (!WEBFLOW_API_TOKEN) {
    console.error('WEBFLOW_API_TOKEN environment variable is required');
}
if (!SITE_ID) {
    console.error('WEBFLOW_SITE_ID environment variable is required');
} // You'll need to get this from Webflow

// Helper function to format course data for Webflow
function formatCourseForWebflow(courseData) {
    console.log('Input courseData:', courseData);
    
    // Generate a URL-safe slug
    const generateSlug = (name) => {
        if (!name) return 'untitled-course';
        return name.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    // Format dates properly for Webflow
    const formatDate = (dateString) => {
        if (!dateString) return null;
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return null;
            return date.toISOString();
        } catch (e) {
            return null;
        }
    };

    // Get the course name
    const courseName = courseData.courseName || courseData['course-name'] || 'Untitled Course';
    
    // Build age range string
    const minAge = courseData['min-age'] || courseData.minAge || 13;
    const maxAge = courseData['max-age'] || courseData.maxAge || 18;
    const ageRange = `${minAge}-${maxAge}`;

    // Simple field mapping based on what's actually in your Webflow collection
    // Updated for API v2 format
    const webflowItem = {
        fieldData: {
            // Basic required fields
            name: courseName,
            slug: generateSlug(courseName),
            
            // Simple text fields only - avoid complex objects
            age: ageRange,
            fees: parseFloat(courseData['course-fee'] || courseData.courseFee || 0),
            duration: courseData['course-duration'] || courseData.courseDuration || '',
            location: courseData.location || '',
            
            // Dates as ISO strings
            dates: `${courseData['start-date'] || ''} to ${courseData['end-date'] || ''}`,
            
            // Provider info
            provider: courseData['contact-email'] || courseData.contactEmail || '',
            
            // Rich text content
            accommodation: courseData.accommodation || '',
            'tuition-details': courseData.tuition || '',
            'extra-activities': courseData['extra-activities'] || courseData.extraActivities || '',
            
            // Status - moved to top level in v2
            '_archived': false
        },
        isDraft: true
    };

    console.log('Formatted webflowItem:', webflowItem);
    return webflowItem;
}

// Main handler function
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { action, courseId, ...courseData } = req.body || {};

    try {
        let response;
        let result;

        switch (action || req.method) {
            case 'CREATE':
            case 'POST':
                try {
                    console.log('Creating course with data:', courseData);
                    
                    // Create new course
                    const newCourse = formatCourseForWebflow(courseData);
                    console.log('Sending to Webflow:', JSON.stringify(newCourse, null, 2));
                    
                    response = await fetch(`https://api.webflow.com/v2/collections/${COLLECTION_ID}/items`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(newCourse)
                    });

                    console.log('Webflow response status:', response.status);
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('Webflow API error response:', {
                            status: response.status,
                            statusText: response.statusText,
                            body: errorText,
                            headers: Object.fromEntries(response.headers.entries())
                        });
                        
                        // Return specific error messages for different status codes
                        if (response.status === 401) {
                            throw new Error('Invalid Webflow API token. Please check your credentials.');
                        } else if (response.status === 400) {
                            throw new Error(`Invalid request data: ${errorText}`);
                        } else if (response.status === 404) {
                            throw new Error('Webflow collection not found. Please check your collection ID.');
                        }
                        
                        throw new Error(`Webflow API error: ${response.status} - ${errorText}`);
                    }

                    result = await response.json();
                    console.log('Webflow success response:', result);
                    
                    // Don't publish immediately - keep as draft
                    // await publishItem(result._id);
                    
                    return res.status(200).json({
                        success: true,
                        message: 'Course created successfully',
                        data: result
                    });
                } catch (createError) {
                    console.error('Create course error:', createError);
                    throw createError;
                }

            case 'UPDATE':
            case 'PUT':
                // Update existing course
                if (!courseId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Course ID is required for updates'
                    });
                }

                const updatedCourse = formatCourseForWebflow(courseData);
                
                response = await fetch(`https://api.webflow.com/v2/collections/${COLLECTION_ID}/items/${courseId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedCourse)
                });

                if (!response.ok) {
                    const error = await response.text();
                    throw new Error(`Webflow API error: ${response.status} - ${error}`);
                }

                result = await response.json();
                
                // Publish the updated item
                await publishItem(courseId);
                
                return res.status(200).json({
                    success: true,
                    message: 'Course updated successfully',
                    data: result
                });

            case 'DELETE':
                // Delete course
                if (!courseId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Course ID is required for deletion'
                    });
                }

                response = await fetch(`https://api.webflow.com/v2/collections/${COLLECTION_ID}/items/${courseId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`
                    }
                });

                if (!response.ok) {
                    const error = await response.text();
                    throw new Error(`Webflow API error: ${response.status} - ${error}`);
                }

                return res.status(200).json({
                    success: true,
                    message: 'Course deleted successfully'
                });

            case 'LIST':
            case 'GET':
                // Get all courses
                response = await fetch(`https://api.webflow.com/v2/collections/${COLLECTION_ID}/items`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`
                    }
                });

                if (!response.ok) {
                    const error = await response.text();
                    throw new Error(`Webflow API error: ${response.status} - ${error}`);
                }

                result = await response.json();
                
                return res.status(200).json({
                    success: true,
                    data: result.items || []
                });

            case 'DUPLICATE':
                // Duplicate a course
                if (!courseId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Course ID is required for duplication'
                    });
                }

                // First, get the original course
                const getResponse = await fetch(`https://api.webflow.com/v2/collections/${COLLECTION_ID}/items/${courseId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`
                    }
                });

                if (!getResponse.ok) {
                    throw new Error(`Failed to fetch course for duplication`);
                }

                const originalCourse = await getResponse.json();
                
                // Create a copy with modified name
                const duplicatedCourse = {
                    ...originalCourse,
                    fields: {
                        ...originalCourse.fields,
                        name: `${originalCourse.fields.name} (Copy)`,
                        slug: `${originalCourse.fields.slug}-copy-${Date.now()}`,
                        '_draft': true
                    }
                };
                
                delete duplicatedCourse._id;
                delete duplicatedCourse.created;
                delete duplicatedCourse.updated;

                // Create the duplicate
                const createResponse = await fetch(`https://api.webflow.com/v2/collections/${COLLECTION_ID}/items`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(duplicatedCourse)
                });

                if (!createResponse.ok) {
                    throw new Error(`Failed to create duplicate course`);
                }

                result = await createResponse.json();
                
                return res.status(200).json({
                    success: true,
                    message: 'Course duplicated successfully',
                    data: result
                });

            default:
                return res.status(405).json({
                    success: false,
                    message: `Method ${req.method} not allowed`
                });
        }
    } catch (error) {
        console.error('Webflow API Error:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            requestData: { action, courseId, ...courseData }
        });
        
        // Return more specific error information
        const errorMessage = error.message || 'An error occurred while processing your request';
        const statusCode = error.message?.includes('Invalid Webflow API token') ? 401 : 
                          error.message?.includes('not found') ? 404 : 500;
        
        return res.status(statusCode).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

// Helper function to publish items
async function publishItem(itemId) {
    try {
        const response = await fetch(`https://api.webflow.com/v2/sites/${SITE_ID}/publish`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                publishToWebflowSubdomain: true
            })
        });

        if (!response.ok) {
            console.error('Failed to publish item:', itemId);
        }
    } catch (error) {
        console.error('Publish error:', error);
    }
}