// Memberstack Admin API - Fetch all users
// This is a server-side endpoint to securely fetch Memberstack users

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ 
            success: false, 
            message: 'Method not allowed' 
        });
    }

    try {
        // Get Memberstack secret key from environment variable
        const MEMBERSTACK_SECRET_KEY = process.env.MEMBERSTACK_SECRET_KEY;
        
        if (!MEMBERSTACK_SECRET_KEY) {
            console.error('MEMBERSTACK_SECRET_KEY not configured');
            return res.status(500).json({
                success: false,
                message: 'Memberstack API not configured. Please add MEMBERSTACK_SECRET_KEY to environment variables.',
                help: 'Get your secret key from Memberstack Dashboard > Settings > API Keys'
            });
        }

        // Fetch members from Memberstack API
        const response = await fetch('https://admin.memberstack.com/members', {
            method: 'GET',
            headers: {
                'X-API-KEY': MEMBERSTACK_SECRET_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Memberstack API error:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            });
            
            if (response.status === 401) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid Memberstack secret key. Please check your API credentials.'
                });
            }
            
            throw new Error(`Memberstack API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        // Format the member data for display
        const members = (data.data || data.members || []).map(member => ({
            id: member.id,
            email: member.auth?.email || member.email,
            createdAt: member.createdAt,
            customFields: member.customFields || {},
            planConnections: member.planConnections || [],
            metadata: member.metadata || {},
            // Add login URL for testing
            loginHint: `Use email: ${member.auth?.email || member.email} with your password`
        }));

        return res.status(200).json({
            success: true,
            totalMembers: members.length,
            members: members,
            message: `Found ${members.length} Memberstack users`
        });

    } catch (error) {
        console.error('Error fetching Memberstack users:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch Memberstack users',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};