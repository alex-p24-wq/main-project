# 🔗 CORS Configuration Fix for Production

## Problem
Your backend CORS was set to `false` in production, blocking all requests from your Vercel frontend.

**Old Code** (line 17-23 in `backend/server.js`):
```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000', 'http://localhost:5173'],
  // This blocks ALL origins in production ❌
};
```

## Solution

**Updated Code**:
```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://your-app.vercel.app'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-App-Check']
};
```

### How It Works

- **Development**: Allows `localhost:3000` and `localhost:5173`
- **Production**: Allows only your Vercel frontend URL from `FRONTEND_URL` env variable
- **Fallback**: If `FRONTEND_URL` not set, uses placeholder (you should update this)

---

## Configuration Steps

### 1. Update Your Render Environment Variable

Add this to your Render backend service:

**Environment Variable**:
```
FRONTEND_URL=https://your-actual-app.vercel.app
```

⚠️ **Replace** `your-actual-app.vercel.app` with your real Vercel URL!

### 2. Commit and Push Changes

```bash
git add backend/server.js
git commit -m "Fix: Update CORS to allow Vercel frontend in production"
git push origin main
```

### 3. Render Auto-Redeploys

Render will automatically detect the push and redeploy.

---

## Verify CORS is Working

### Test with cURL:
```bash
curl -H "Origin: https://your-app.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://your-backend.onrender.com/api/health
```

**Expected Response Headers**:
```
Access-Control-Allow-Origin: https://your-app.vercel.app
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

### Test from Browser Console:

Visit your Vercel app and open DevTools Console:

```javascript
fetch('https://your-backend.onrender.com/api/health', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

**Success**: You'll see `{ status: 'OK', ... }`
**Failure**: CORS error in console

---

## Common CORS Errors & Fixes

### Error: "No 'Access-Control-Allow-Origin' header"
**Cause**: `FRONTEND_URL` not set or incorrect
**Fix**: 
1. Check Render env var `FRONTEND_URL` 
2. Make sure it matches your Vercel URL exactly (no trailing slash)
3. Redeploy if needed

### Error: "Credentials flag is 'true', but the 'Access-Control-Allow-Credentials' header is ''"
**Cause**: CORS credentials not properly configured
**Fix**: This should already be set in the code (`credentials: true`)

### Error: "CORS policy blocks request method"
**Cause**: Request method not in allowed methods
**Fix**: Already includes all standard methods (GET, POST, PUT, PATCH, DELETE, OPTIONS)

---

## Multiple Frontend Domains (Optional)

If you have staging + production frontends:

```javascript
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      process.env.FRONTEND_URL,           // Production: https://app.vercel.app
      process.env.FRONTEND_STAGING_URL     // Staging: https://app-staging.vercel.app
    ].filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:5173'];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-App-Check']
};
```

Then add both URLs to Render environment variables.

---

## Security Best Practices

✅ **DO**:
- Use specific domain in `FRONTEND_URL` (not wildcard `*`)
- Keep `credentials: true` for cookie-based auth
- Use HTTPS in production URLs

❌ **DON'T**:
- Use `origin: '*'` with `credentials: true` (browsers block this)
- Allow `http://` origins in production
- Include trailing slashes in URLs

---

✅ **Status**: CORS configuration updated and ready for production!
