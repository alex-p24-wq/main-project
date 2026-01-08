# 🚀 Vercel Frontend Environment Variables Setup

## 📋 Required Environment Variables

Your frontend needs these environment variables to connect to your backend and external services.

---

## 🔴 **CRITICAL - Backend Connection**

### 1. **VITE_API_URL** (REQUIRED)
**Description**: Your Render backend API URL

**Value**: 
```
https://your-backend-name.onrender.com
```

**Where to get it**:
1. Go to Render Dashboard
2. Find your backend service
3. Copy the URL (top of the page)
4. **DON'T add `/api` at the end** - the frontend adds it automatically

**Example**:
- ✅ Correct: `https://ecardamom-backend.onrender.com`
- ❌ Wrong: `https://ecardamom-backend.onrender.com/api`
- ❌ Wrong: `https://ecardamom-backend.onrender.com/`

---

## 🔵 **OPTIONAL - Firebase (Google OAuth & App Check)**

These are optional but recommended for full functionality:

### 2. **VITE_FIREBASE_API_KEY**
**Default**: `AIzaSyBThNEq2wzP1ybF0A1DtLxB-Fn44XDg0Yc`
**Description**: Firebase API key for authentication
**Optional**: Yes (has default value)

### 3. **VITE_FIREBASE_AUTH_DOMAIN**
**Default**: `cardo-6cd15.firebaseapp.com`
**Description**: Firebase Auth domain
**Optional**: Yes (has default value)

### 4. **VITE_FIREBASE_PROJECT_ID**
**Default**: `cardo-6cd15`
**Description**: Firebase project ID
**Optional**: Yes (has default value)

### 5. **VITE_FIREBASE_STORAGE_BUCKET**
**Default**: `cardo-6cd15.firebasestorage.app`
**Description**: Firebase storage bucket
**Optional**: Yes (has default value)

### 6. **VITE_FIREBASE_MESSAGING_SENDER_ID**
**Default**: `730278224394`
**Description**: Firebase messaging sender ID
**Optional**: Yes (has default value)

### 7. **VITE_FIREBASE_APP_ID**
**Default**: `1:730278224394:web:bced3ccd89785923fd35f3`
**Description**: Firebase app ID
**Optional**: Yes (has default value)

### 8. **VITE_FIREBASE_MEASUREMENT_ID**
**Default**: `G-KTQY1206SC`
**Description**: Firebase analytics measurement ID
**Optional**: Yes (has default value)

### 9. **VITE_FIREBASE_APPCHECK_SITE_KEY**
**Default**: Not set (App Check disabled by default)
**Description**: Firebase App Check reCAPTCHA v3 site key
**Optional**: Yes (only needed if using App Check)

---

## 🟢 **OPTIONAL - Razorpay (Payment Gateway)**

### 10. **VITE_RAZORPAY_KEY_ID**
**Default**: None (Razorpay payment won't work without this)
**Description**: Razorpay publishable key ID
**Optional**: Yes (only needed for payments)

**Where to get it**:
1. Go to: https://dashboard.razorpay.com/
2. Sign up/Login
3. Settings → API Keys
4. Copy **Key Id** (starts with `rzp_test_` or `rzp_live_`)

---

## 📝 **How to Add Environment Variables to Vercel**

### Method 1: Vercel Dashboard (Recommended)

1. **Go to**: https://vercel.com/dashboard
2. **Select** your project
3. **Click**: Settings tab
4. **Click**: Environment Variables (left sidebar)
5. **Add each variable**:
   - Key: `VITE_API_URL`
   - Value: `https://your-backend.onrender.com`
   - Environment: ✅ Production, ✅ Preview, ✅ Development
6. **Click**: "Save"
7. **Repeat** for any optional variables you want to add

8. **Redeploy**:
   - Go to **Deployments** tab
   - Click ⋮ (three dots) on latest deployment
   - Click **"Redeploy"**
   - Check ✅ "Use existing Build Cache"
   - Click **"Redeploy"**

---

### Method 2: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Add environment variables
vercel env add VITE_API_URL
# Then paste your backend URL when prompted

# Pull environment variables to local
vercel env pull .env.local
```

---

## 🎯 **Minimum Setup (Just to Get Started)**

If you want to get started quickly, **only add this ONE variable**:

```
VITE_API_URL=https://your-backend.onrender.com
```

Everything else has defaults and will work automatically!

---

## ✅ **Recommended Setup (Full Features)**

For full functionality, add these variables:

| Variable | Value | Priority |
|----------|-------|----------|
| `VITE_API_URL` | `https://your-backend.onrender.com` | 🔴 **REQUIRED** |
| `VITE_RAZORPAY_KEY_ID` | `rzp_test_xxxxx` | 🟡 Needed for payments |

Leave Firebase variables empty - they have defaults!

---

## 🧪 **How to Verify Environment Variables**

### After deployment, check if variables are working:

1. **Open your Vercel app** in browser
2. **Open DevTools Console** (F12)
3. **Type**:
```javascript
// Check if API URL is set
console.log('API URL:', import.meta.env.VITE_API_URL);

// Should show your Render backend URL
```

4. **Test backend connection**:
   - Try to login/register
   - Check Network tab in DevTools
   - API calls should go to your Render backend, NOT localhost

---

## 🐛 **Troubleshooting**

### Issue: Frontend still connects to localhost

**Cause**: `VITE_API_URL` not set or deployment not redeployed

**Fix**:
1. Verify `VITE_API_URL` exists in Vercel environment variables
2. Make sure it's enabled for "Production"
3. Redeploy the application
4. Clear browser cache (Ctrl+Shift+R)

---

### Issue: "CORS policy blocks request"

**Cause**: Backend `FRONTEND_URL` doesn't match your Vercel domain

**Fix in Render**:
1. Go to Render Dashboard → Your Backend → Environment
2. Add/Update: `FRONTEND_URL` = `https://your-app.vercel.app`
3. Make sure there's no trailing slash
4. Redeploy backend

---

### Issue: Google Sign-In not working

**Cause**: Firebase OAuth redirect URIs not configured

**Fix**:
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project
3. Authentication → Sign-in method → Google → Configure
4. Add authorized domains:
   - `your-app.vercel.app`
   - `your-app-git-main.vercel.app`
   - All your Vercel deployment URLs

---

### Issue: Razorpay payment failing

**Cause**: `VITE_RAZORPAY_KEY_ID` not set or wrong key

**Fix**:
1. Get Test Key from Razorpay Dashboard
2. Add to Vercel as `VITE_RAZORPAY_KEY_ID`
3. Redeploy
4. Use test card: 4111 1111 1111 1111, Any future date, Any CVV

---

## 📦 **Environment Variables Template**

Copy this to a safe place (NOT in Git):

```bash
# ===================================
# VERCEL FRONTEND ENVIRONMENT VARIABLES
# ===================================

# REQUIRED: Backend API URL
VITE_API_URL=https://your-backend.onrender.com

# OPTIONAL: Firebase (has defaults, only override if using your own)
# VITE_FIREBASE_API_KEY=
# VITE_FIREBASE_AUTH_DOMAIN=
# VITE_FIREBASE_PROJECT_ID=
# VITE_FIREBASE_STORAGE_BUCKET=
# VITE_FIREBASE_MESSAGING_SENDER_ID=
# VITE_FIREBASE_APP_ID=
# VITE_FIREBASE_MEASUREMENT_ID=
# VITE_FIREBASE_APPCHECK_SITE_KEY=

# OPTIONAL: Razorpay (only needed for payments)
# VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

---

## 🔒 **Security Best Practices**

### ✅ **DO**:
- Use `VITE_` prefix for all frontend env vars (Vite requirement)
- Use test keys for Razorpay until ready for production
- Keep Firebase keys in environment variables (even though they're public-facing)
- Use different Firebase projects for dev/staging/prod

### ❌ **DON'T**:
- Commit `.env` files to Git (already in `.gitignore`)
- Use Razorpay live keys until thoroughly tested
- Share backend secrets in frontend (backend handles secrets)
- Hardcode API URLs in code

---

## 🚀 **Quick Deploy Checklist**

- [ ] Add `VITE_API_URL` in Vercel (your Render backend URL)
- [ ] Add `VITE_RAZORPAY_KEY_ID` if using payments
- [ ] All variables set to "Production" environment
- [ ] Redeployed after adding variables
- [ ] Tested login/API calls in browser
- [ ] Checked DevTools Network tab (calls go to Render, not localhost)
- [ ] Backend `FRONTEND_URL` set to Vercel domain
- [ ] CORS working (no errors in console)

---

## 📊 **Deployment Flow**

```
1. Add environment variables in Vercel
   ↓
2. Redeploy frontend (Deployments → Redeploy)
   ↓
3. Verify variables loaded (check console)
   ↓
4. Test API connection (try login)
   ↓
5. ✅ Frontend connects to Render backend!
```

---

## 🎉 **Next Steps After Setup**

1. **Test all features**:
   - Login/Register
   - Google Sign-In
   - Create products (farmer)
   - Browse products (customer)
   - Place orders
   - Payments (if Razorpay configured)

2. **Monitor logs**:
   - Vercel: Deployments → Click deployment → Runtime Logs
   - Render: Your service → Logs tab

3. **Set up custom domain** (optional):
   - Vercel: Settings → Domains
   - Add your custom domain
   - Update `FRONTEND_URL` in Render backend

---

## 📚 **Related Documentation**

- **Vercel Env Vars**: https://vercel.com/docs/concepts/projects/environment-variables
- **Vite Env Vars**: https://vitejs.dev/guide/env-and-mode.html
- **Firebase Console**: https://console.firebase.google.com/
- **Razorpay Dashboard**: https://dashboard.razorpay.com/

---

✅ **You're ready to deploy!** Just add `VITE_API_URL` and you're good to go!
