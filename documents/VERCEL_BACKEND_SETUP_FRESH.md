# 🚀 Fresh Vercel Backend Deployment Guide

Complete guide to deploy your E-Cardamom Connect backend to Vercel from scratch.

---

## 📋 Prerequisites

- [ ] GitHub account with repository access
- [ ] Vercel account (sign up at https://vercel.com)
- [ ] MongoDB Atlas database (with connection string)
- [ ] Gmail App Password (for email OTP functionality)

---

## 🎯 Step 1: Verify Backend Files

Ensure these files exist in your `backend/` directory:

### ✅ Required Files Checklist:

```
backend/
├── server.js              ✓ Entry point
├── package.json           ✓ Dependencies
├── vercel.json            ✓ Vercel config
├── .env.example           ✓ Template for env vars
├── routes/                ✓ API routes
│   ├── auth.js
│   ├── farmer.js
│   ├── customer.js
│   ├── admin.js
│   ├── hub.js
│   ├── hubmanager.js
│   ├── agricare.js
│   ├── feedback.js
│   ├── payment.js
│   ├── notifications.js
│   └── orderRequest.js
├── models/                ✓ Database models
├── middleware/            ✓ Auth middleware
└── utils/                 ✓ Helper functions
```

---

## 🔧 Step 2: Prepare Environment Variables

Copy the following environment variables. You'll paste them in Vercel Dashboard:

### **Required Environment Variables:**

```bash
# 1. MongoDB Connection
MONGO_URI=mongodb+srv://alex:alex@cluster0.8nddloo.mongodb.net/ecardamom?retryWrites=true&w=majority&appName=Cluster0

# 2. JWT Secret (IMPORTANT: Change this!)
JWT_SECRET=your_super_secret_random_string_here_make_it_long_and_secure

# 3. Environment
NODE_ENV=production

# 4. Email Configuration (Gmail)
USE_GMAIL=true
SMTP_SECURE=true
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
MAIL_FROM=your-email@gmail.com

# 5. Frontend URL (CORS) - UPDATE AFTER FRONTEND DEPLOYMENT
FRONTEND_URL=http://localhost:5173
```

### **How to Get Gmail App Password:**

1. Go to Google Account: https://myaccount.google.com/security
2. Enable 2-Step Verification (if not already enabled)
3. Search for "App Passwords"
4. Generate new app password for "Mail"
5. Copy the 16-character password (no spaces)
6. Use this as `SMTP_PASS`

---

## 🌐 Step 3: Deploy to Vercel

### **Option A: Via Vercel Dashboard (Recommended)**

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Click "Add New" → "Project"

2. **Import Repository:**
   - Select: `alex-p24-wq/mini-project` (or your repo)
   - Click "Import"

3. **Configure Project Settings:**

   ```
   Framework Preset: Other
   Root Directory: backend
   Build Command: (leave empty)
   Output Directory: (leave empty)
   Install Command: npm install
   Development Command: node server.js
   Node.js Version: 20.x
   ```

4. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add ALL variables from Step 2 above
   - **Important:** Add them to all environments (Production, Preview, Development)

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes for deployment to complete

---

### **Option B: Via Vercel CLI (Alternative)**

If you have Vercel CLI installed:

```bash
# Navigate to backend directory
cd backend

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# Or deploy directly to production
vercel --prod
```

---

## ✅ Step 4: Verify Deployment

After deployment completes:

### 1. **Get Your Backend URL:**
   - Example: `https://mini-project-xxxxx.vercel.app`

### 2. **Test Health Endpoint:**

Open in browser or use curl:

```bash
curl https://your-backend-url.vercel.app/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-10-28T...",
  "environment": "production"
}
```

### 3. **Test Root Endpoint:**

```bash
curl https://your-backend-url.vercel.app/
```

Expected response:
```json
{
  "name": "E-Cardamom Connect API",
  "version": "1.0.0",
  "status": "running",
  ...
}
```

---

## 🔄 Step 5: Update FRONTEND_URL

Once you have your **frontend deployed** (on Vercel or Render):

1. Go to Vercel Dashboard → Your Backend Project
2. Settings → Environment Variables
3. Update `FRONTEND_URL` to your frontend URL:
   ```
   FRONTEND_URL=https://your-frontend.vercel.app
   ```
   OR
   ```
   FRONTEND_URL=https://your-frontend.onrender.com
   ```
4. Click "Save"
5. **Redeploy** the backend (Deployments → Latest → Redeploy)

---

## 🎨 Step 6: Update Frontend Configuration

In your frontend `.env` file:

```bash
VITE_API_URL=https://your-backend-url.vercel.app
```

Restart frontend dev server:
```bash
cd frontend
npm run dev
```

---

## 🐛 Troubleshooting

### **Issue 1: 500 Internal Server Error**

**Check:**
- MongoDB connection string is correct
- MongoDB Atlas allows connections from `0.0.0.0/0` (Network Access)
- All environment variables are set

**Fix:**
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Verify all variables are present
- Check Vercel logs: Functions → View Function Logs

---

### **Issue 2: CORS Error from Frontend**

**Error:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Fix:**
- Ensure `FRONTEND_URL` is set to your frontend domain
- Redeploy backend after updating `FRONTEND_URL`

---

### **Issue 3: MongoDB Connection Failed**

**Error:**
```
Failed to connect to database
```

**Fix:**
1. Go to MongoDB Atlas
2. Network Access → Add IP Address → Allow from Anywhere (`0.0.0.0/0`)
3. Database Access → Ensure user has read/write permissions

---

### **Issue 4: Duplicate Export Error**

**Error:**
```
SyntaxError: Identifier '.default' has already been declared
```

**Fix:**
- This is already fixed in the latest code
- Ensure you're deploying the latest commit from GitHub

---

## 📊 MongoDB Atlas Configuration

### **Network Access:**

1. Go to MongoDB Atlas → Network Access
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere"
4. IP Address: `0.0.0.0/0`
5. Click "Confirm"

**Why?** Vercel uses dynamic IPs, so we must allow all IPs.

### **Database User:**

Ensure your database user has:
- Username: `alex` (or your username)
- Password: (your password)
- Role: `readWriteAnyDatabase` or `Atlas admin`

---

## 🔒 Security Best Practices

### **1. Strong JWT Secret:**
```bash
# Generate a random string (32+ characters)
JWT_SECRET=$(openssl rand -base64 32)
```

### **2. Environment Variables:**
- Never commit `.env` files to Git
- Use `.env.example` as a template
- Rotate secrets periodically

### **3. CORS Configuration:**
- Only allow your frontend domain
- Update `FRONTEND_URL` after deployment

---

## 📦 Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] MongoDB Atlas allows 0.0.0.0/0
- [ ] Root Directory set to `backend`
- [ ] Node.js version: 20.x
- [ ] Health endpoint returns 200 OK
- [ ] FRONTEND_URL updated to production frontend
- [ ] Frontend `.env` has correct `VITE_API_URL`

---

## 🎉 Success!

Your backend should now be live at:
```
https://your-project-name.vercel.app
```

### **Next Steps:**

1. ✅ Test all API endpoints
2. ✅ Deploy frontend (if not already)
3. ✅ Update `FRONTEND_URL` in Vercel
4. ✅ Test login/register flow
5. ✅ Test all user roles (farmer, customer, admin, etc.)

---

## 📞 Need Help?

**Common Commands:**

```bash
# Check deployment status
vercel ls

# View logs
vercel logs

# Redeploy
vercel --prod
```

**Resources:**
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas: https://cloud.mongodb.com
- Repository: https://github.com/alex-p24-wq/E-Cardamom_connect

---

**Created:** 2025-10-28  
**Last Updated:** 2025-10-28  
**Version:** 1.0.0
