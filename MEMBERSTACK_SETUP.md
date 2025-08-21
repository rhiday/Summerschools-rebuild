# Memberstack Setup Guide

## Quick Setup

To enable Memberstack authentication, you need to add your Memberstack public key:

### 1. Get Your Public Key
1. Log in to your [Memberstack Dashboard](https://app.memberstack.com)
2. Go to **Settings > API Keys**
3. Copy your **Public Key** (starts with `pk_`)

### 2. Update Configuration
Edit the file `js/memberstack-config.js` and replace the placeholder with your actual public key:

```javascript
window.MEMBERSTACK_CONFIG = {
    publicKey: 'pk_sb_YOUR_ACTUAL_PUBLIC_KEY_HERE',  // <-- Replace this
    loginRedirect: '/index.html',
    signupRedirect: '/index.html',
    debug: true
};
```

### 3. Update HTML Files
In both `auth.html` and `index.html`, update the Memberstack script tag with your app ID:

```html
<!-- Replace app_clxxx with your actual app ID -->
<script src="https://static.memberstack.com/scripts/v1/memberstack-dom.js" 
        data-memberstack-app="app_YOUR_APP_ID"></script>
```

You can find your app ID in the Memberstack dashboard under **Settings > Installation**.

## Testing with Memberstack Users

Once configured, the system will:
1. Use Memberstack for authentication instead of mock users
2. Sync member IDs with Webflow provider records
3. Maintain sessions across page loads
4. Show actual member data in the user menu

## Fallback Mode

If Memberstack is not configured or unavailable, the system automatically falls back to mock authentication with these test accounts:
- Email: `provider@test.com` / Password: `password123`
- Email: `admin@test.com` / Password: `password123`

## Troubleshooting

### "Memberstack not initialized"
- Check that your public key is correct
- Verify the app ID in the script tag matches your Memberstack app
- Check browser console for any API errors

### "Invalid credentials"
- Ensure the user exists in your Memberstack dashboard
- Verify the email and password are correct
- Check if the member's account is active

### Dashboard infinite loading
- Clear browser localStorage: `localStorage.clear()`
- Check that authentication service is loaded
- Verify no redirect loops in console logs

## Environment Variables (Optional)

For production, you can also set these as environment variables in Vercel:
- `MEMBERSTACK_PUBLIC_KEY`
- `MEMBERSTACK_APP_ID`

Then update the configuration to use environment variables:
```javascript
publicKey: process.env.MEMBERSTACK_PUBLIC_KEY || 'pk_sb_default'
```