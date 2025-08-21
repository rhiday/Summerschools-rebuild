# Production Deployment Guide

## 🚀 Moving from Local Development to Production

Your authentication system is now **environment-aware** and will automatically switch between:
- **Local authentication** (localhost) - for development
- **Memberstack authentication** (production domains) - for live users

## 📋 Production Checklist

### 1. **Environment Variables**
Make sure these are set in your Vercel environment:

```bash
# Required for production
MEMBERSTACK_SECRET_KEY=sk_your_secret_key_here
MEMBERSTACK_PUBLIC_KEY=pk_your_public_key_here
WEBFLOW_API_TOKEN=your_webflow_token
WEBFLOW_SITE_ID=your_site_id
WEBFLOW_COLLECTION_ID=your_collection_id
WEBFLOW_PROVIDER_COLLECTION_ID=your_provider_collection_id
```

### 2. **Replace Development Files**
Before deploying, replace the local-only auth files:

```bash
# Replace auth.html with production version
mv auth-production.html auth.html

# Update index.html to use environment auth
# (Update the script tag to use js/auth-environment.js)
```

### 3. **Memberstack Configuration**
In your Memberstack dashboard:
- Add your production domain to allowed origins
- Verify your app ID: `app_cm42ruz6100e40st17ebveb3p`
- Test API keys are working

### 4. **Deploy Commands**

```bash
# Deploy to Vercel
npm run deploy

# Or push to git (if connected to Vercel)
git add .
git commit -m "Production deployment with environment-aware auth"
git push origin main
```

## 🔄 How Environment Detection Works

The system automatically detects:

| Environment | Domain Examples | Auth Method |
|-------------|----------------|-------------|
| **Development** | `localhost:8000`, `127.0.0.1` | Local auth with test accounts |
| **Production** | `yourdomain.com`, `main-branch.vercel.app` | Memberstack authentication |
| **Preview** | `git-branch-preview.vercel.app` | Local auth (for testing) |

## 🧪 Testing Strategy

### Local Testing (Current Setup)
- ✅ Working with test accounts
- ✅ No external dependencies
- ✅ Fast development cycle

### Production Testing
1. **Deploy to Vercel preview**: Test with preview URLs
2. **Check Memberstack**: Verify script loads and API works
3. **Test real accounts**: Create test users in Memberstack dashboard
4. **API integration**: Ensure backend endpoints work with Memberstack secret key

## 🔧 Quick Production Switch

To quickly switch to production-ready authentication:

### Option 1: Use Environment Auth (Recommended)
```javascript
// Replace in both auth.html and index.html
<script src="js/auth-environment.js"></script>
```

### Option 2: Manual Switch
```html
<!-- Development -->
<script src="js/local-auth.js"></script>

<!-- Production -->
<script src="https://static.memberstack.com/scripts/v1/memberstack-dom.js" 
        data-memberstack-app="app_cm42ruz6100e40st17ebveb3p"></script>
```

## 🐛 Production Troubleshooting

### Common Issues:

1. **"Authentication system unavailable"**
   - Check Memberstack CDN is accessible
   - Verify app ID is correct
   - Check console for script loading errors

2. **"Invalid credentials"**
   - Ensure user exists in Memberstack dashboard
   - Check if Memberstack account is active
   - Verify API keys are correct

3. **CORS errors**
   - Add production domain to Memberstack allowed origins
   - Check Vercel deployment domain settings

### Debug Commands:
```javascript
// Check environment detection
console.log(window.environmentAuth.getEnvironmentInfo());

// Test authentication state
console.log(window.environmentAuth.getCurrentUser());

// Manual auth test
window.environmentAuth.signIn('test@example.com', 'password');
```

## 📊 Monitoring

The system logs detailed information:
- Environment detection results
- Authentication method selection  
- User login/logout events
- API integration status

Monitor these logs in:
- Browser console (development)
- Vercel function logs (production)
- Memberstack dashboard analytics

## 🔒 Security Notes

- **Never commit** secret keys to git
- **Rotate keys** regularly in Memberstack dashboard
- **Use HTTPS** only in production
- **Validate** user permissions on server-side endpoints

## 🚀 Ready to Deploy?

1. ✅ Environment variables configured
2. ✅ Memberstack dashboard setup
3. ✅ Production files ready
4. ✅ Testing completed

Run: `npm run deploy` or push to your connected git repository!