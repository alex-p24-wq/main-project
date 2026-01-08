# ⚡ Vercel Frontend - Quick Setup (3 Steps)

## 🎯 **TL;DR - Just Do This**

### Step 1: Get Your Render Backend URL (30 seconds)

1. Go to: https://dashboard.render.com/
2. Click your backend service
3. **Copy the URL** at the top (e.g., `https://ecardamom-backend-abc123.onrender.com`)

---

### Step 2: Add Environment Variable in Vercel (1 minute)

1. Go to: https://vercel.com/dashboard
2. Click your project
3. Click **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Fill in:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend.onrender.com` (paste from Step 1)
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development
6. Click **"Save"**

---

### Step 3: Redeploy (1 minute)

1. Click **Deployments** tab
2. Click ⋮ (three dots) on the latest deployment
3. Click **"Redeploy"**
4. ✅ Check "Use existing Build Cache"
5. Click **"Redeploy"**

---

## ✅ **Done!**

Wait 2-3 minutes for deployment to complete, then:

**Test your app**: `https://your-app.vercel.app`

Try logging in - it should connect to your Render backend! 🎉

---

## 📋 **Environment Variables Summary**

| Variable | Required? | Value |
|----------|-----------|-------|
| `VITE_API_URL` | ✅ **YES** | `https://your-backend.onrender.com` |
| `VITE_RAZORPAY_KEY_ID` | ❌ No (only for payments) | Get from https://dashboard.razorpay.com/ |
| Firebase variables | ❌ No (has defaults) | Leave empty |

---

## 🐛 **Quick Troubleshooting**

### Still connecting to localhost?
- Check VITE_API_URL is saved in Vercel
- Make sure you redeployed after adding it
- Clear browser cache (Ctrl+Shift+R)

### CORS errors?
- Go to Render → Your Backend → Environment
- Add: `FRONTEND_URL` = `https://your-app.vercel.app`
- Redeploy backend

---

**For detailed documentation, see**: [`VERCEL_FRONTEND_ENV_SETUP.md`](./VERCEL_FRONTEND_ENV_SETUP.md)
