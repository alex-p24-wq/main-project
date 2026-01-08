# Deploy Backend on Vercel + Frontend on Render

This guide helps you deploy the **backend to Vercel** (serverless) and **frontend to Render** (static site).

---

## 📋 Prerequisites

- GitHub repository with your code
- [Vercel Account](https://vercel.com)
- [Render Account](https://render.com)
- MongoDB Atlas database (cloud-hosted)

---

## 🔧 Part 1: Deploy Backend to Vercel

### Step 1: Prepare Backend Configuration

The backend is now configured with `backend/vercel.json` for Vercel serverless deployment.

### Step 2: Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. **Configure Project Settings:**
   - **Framework Preset:** Other
   - **Root Directory:** `backend`
   - **Build Command:** Leave empty (auto-detected)
   - **Output Directory:** Leave empty
   - **Install Command:** `npm install`

### Step 3: Set Environment Variables in Vercel

Add these environment variables in Vercel project settings:

```env
NODE_ENV=production
MONGO_URI=mongodb+srv://alex:alex@cluster0.8nddloo.mongodb.net/ecardamom?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-jwt-secret-key-here
USE_GMAIL=true
SMTP_SECURE=true
SMTP_PORT=465
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-gmail-app-password
MAIL_FROM=your-gmail@gmail.com
FRONTEND_URL=https://your-frontend-name.onrender.com
```

**Important Notes:**
- Replace `your-jwt-secret-key-here` with a secure random string
- Use your actual Gmail credentials
- `FRONTEND_URL` will be your Render frontend URL (update after frontend deployment)

### Step 4: Deploy Backend

1. Click **"Deploy"**
2. Wait for deployment to complete
3. Note your backend URL: `https://your-backend-name.vercel.app`

### Step 5: Test Backend

Visit: `https://your-backend-name.vercel.app/api/health`

You should see:
```json
{
  "status": "OK",
  "timestamp": "2025-10-27T...",
  "environment": "production"
}
```

---

## 🎨 Part 2: Deploy Frontend to Render

### Step 1: Create Render Static Site

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Static Site"**
3. Connect your GitHub repository
4. **Configure Build Settings:**
   - **Name:** `ecardamom-frontend`
   - **Branch:** `main`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

### Step 2: Set Environment Variable

Add this environment variable in Render:

```env
VITE_API_URL=https://your-backend-name.vercel.app
```

**Replace** `your-backend-name` with your actual Vercel backend URL.

### Step 3: Deploy Frontend

1. Click **"Create Static Site"**
2. Render will automatically build and deploy
3. Note your frontend URL: `https://your-frontend-name.onrender.com`

### Step 4: Update Backend CORS

Go back to **Vercel** → Your Backend Project → **Settings** → **Environment Variables**

Update `FRONTEND_URL` to your Render frontend URL:
```env
FRONTEND_URL=https://your-frontend-name.onrender.com
```

**Redeploy** the backend for changes to take effect.

---

## ✅ Verification Checklist

- [ ] Backend health check works: `https://your-backend.vercel.app/api/health`
- [ ] Frontend loads: `https://your-frontend.onrender.com`
- [ ] Frontend can communicate with backend (check browser console for CORS errors)
- [ ] Login/Register functionality works
- [ ] MongoDB connection successful (check Vercel logs)
- [ ] Email OTP delivery works

---

## 🔍 Troubleshooting

### Backend Issues

**Problem:** "Route not found" or 404 errors
- **Solution:** Check `backend/vercel.json` routes configuration
- Ensure all API routes start with `/api/`

**Problem:** MongoDB connection fails
- **Solution:** 
  - Verify `MONGO_URI` in Vercel environment variables
  - Check MongoDB Atlas allows connections from `0.0.0.0/0` (all IPs)
  - Ensure database name `ecardamom` is in connection string

**Problem:** CORS errors
- **Solution:**
  - Verify `FRONTEND_URL` matches your Render frontend URL exactly
  - Redeploy backend after updating environment variables

### Frontend Issues

**Problem:** Build fails
- **Solution:**
  - Check Render build logs
  - Ensure `npm install` completes successfully
  - Verify React 18.3.1 is in `package.json`

**Problem:** "Failed to fetch" API errors
- **Solution:**
  - Verify `VITE_API_URL` is set correctly in Render
  - Check browser console for the exact API URL being called
  - Test backend health endpoint directly

**Problem:** White screen or blank page
- **Solution:**
  - Check Render logs for build errors
  - Verify `dist` folder is being generated
  - Check browser console for JavaScript errors

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────┐
│          User's Browser                 │
└────────────┬────────────────────────────┘
             │
             │ HTTPS
             ▼
┌─────────────────────────────────────────┐
│  Frontend (Render Static Site)          │
│  https://ecardamom.onrender.com         │
│  - React 18.3.1                          │
│  - Vite Build                            │
│  - Static Assets                         │
└────────────┬────────────────────────────┘
             │
             │ API Calls
             │ VITE_API_URL
             ▼
┌─────────────────────────────────────────┐
│  Backend (Vercel Serverless)            │
│  https://ecardamom-api.vercel.app       │
│  - Node.js/Express                       │
│  - Serverless Functions                  │
│  - CORS enabled                          │
└────────────┬────────────────────────────┘
             │
             │ MongoDB Connection
             ▼
┌─────────────────────────────────────────┐
│  MongoDB Atlas (Cloud Database)         │
│  cluster0.8nddloo.mongodb.net           │
└─────────────────────────────────────────┘
```

---

## 🚀 Quick Deployment Summary

1. **Backend (Vercel):**
   - Root Directory: `backend`
   - Environment: Serverless Functions
   - URL: `https://your-backend.vercel.app`

2. **Frontend (Render):**
   - Root Directory: `frontend`
   - Environment: Static Site
   - URL: `https://your-frontend.onrender.com`

3. **Key Files:**
   - `backend/vercel.json` - Vercel serverless config
   - `frontend/render.yaml` - Render static site config (optional, use UI instead)

---

## 💡 Important Notes

### Vercel Serverless Limitations

- **File Uploads:** Vercel has a 4.5MB request limit for serverless functions
  - For larger file uploads, consider using cloud storage (AWS S3, Cloudinary)
  - Current multer setup may not work for large images
  
- **Execution Time:** 10-second timeout on free tier
  - Long-running operations may fail
  
- **Stateless:** Each request runs in isolated environment
  - No persistent file storage (uploaded files won't persist)
  - Use external storage for user uploads

### Recommended Improvements

If you need file uploads to work properly on Vercel:

1. **Option 1:** Use Cloudinary/AWS S3 for image storage
2. **Option 2:** Deploy backend to Render Web Service instead (has persistent storage)
3. **Option 3:** Use Vercel Blob Storage (paid feature)

### Alternative Setup

If you encounter issues with Vercel serverless for backend, consider:
- **Backend:** Render Web Service (persistent storage, no serverless limits)
- **Frontend:** Vercel Static (your current setup, works great)

This is actually the recommended setup for most full-stack apps!

---

## 📞 Need Help?

Common deployment sequence:
1. Deploy backend to Vercel first
2. Copy backend URL
3. Deploy frontend to Render with `VITE_API_URL` set to backend URL
4. Copy frontend URL
5. Update backend's `FRONTEND_URL` in Vercel
6. Redeploy backend

**Remember:** After changing environment variables, always redeploy!
