# 🔧 Render Backend Deployment Fix

## Problem
Your backend is trying to connect to `127.0.0.1:27017` (local MongoDB) but Render needs a cloud database connection.

```
MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
```

## Solution: Set Up MongoDB Atlas & Configure Render

### Step 1: Create MongoDB Atlas Database (FREE)

1. **Go to MongoDB Atlas**: https://www.mongodb.com/cloud/atlas/register
2. **Sign Up/Login** with Google or email
3. **Create a FREE Cluster**:
   - Click "Build a Database"
   - Choose **M0 FREE** tier
   - Select region closest to your Render deployment (US/EU/Asia)
   - Click "Create"

4. **Set Up Database Access**:
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Authentication Method: **Password**
   - Username: `ecardamom_admin` (or your choice)
   - Password: Click "Autogenerate Secure Password" and **COPY IT**
   - Database User Privileges: **Read and write to any database**
   - Click "Add User"

5. **Set Up Network Access**:
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Click "**ALLOW ACCESS FROM ANYWHERE**" (0.0.0.0/0)
   - Click "Confirm"
   - ⚠️ **Wait 1-2 minutes** for this to propagate

6. **Get Connection String**:
   - Go to "Database" in left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Driver: **Node.js**, Version: **6.7 or later**
   - Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - Replace `<username>` with your database username
   - Replace `<password>` with the password you copied
   - Add your database name before `?`: `...mongodb.net/ecardamom?retryWrites=true...`

   **Final format**:
   ```
   mongodb+srv://ecardamom_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/ecardamom?retryWrites=true&w=majority
   ```

---

### Step 2: Configure Render Environment Variables

1. **Go to your Render Dashboard**: https://dashboard.render.com/
2. **Select your backend service**
3. **Go to "Environment" tab**
4. **Add these environment variables**:

| Key | Value | Notes |
|-----|-------|-------|
| `MONGO_URI` | `mongodb+srv://ecardamom_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/ecardamom?retryWrites=true&w=majority` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | `your-super-secret-jwt-key-12345` | Generate a random string (min 32 chars) |
| `NODE_ENV` | `production` | Enables production mode |
| `PORT` | `5000` | (Optional, Render auto-assigns) |
| `SMTP_USER` | `your-email@gmail.com` | Your Gmail address |
| `SMTP_PASS` | `xxxx xxxx xxxx xxxx` | Gmail App Password (see below) |
| `USE_GMAIL` | `true` | Enable Gmail SMTP |
| `SMTP_SECURE` | `true` | Use SSL |
| `SMTP_PORT` | `465` | Gmail SSL port |
| `MAIL_FROM` | `your-email@gmail.com` | Sender email address |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Your Vercel frontend URL |

5. **Click "Save Changes"**
6. Render will **automatically redeploy** your backend

---

### Step 3: Get Gmail App Password

1. **Go to Google Account**: https://myaccount.google.com/
2. **Security** → **2-Step Verification** (enable if not already)
3. **App Passwords**: https://myaccount.google.com/apppasswords
4. **Select App**: Mail
5. **Select Device**: Other (Custom name) → "E-Cardamom Backend"
6. **Generate** → Copy the 16-character password
7. **Use this as `SMTP_PASS`** in Render (format: `xxxx xxxx xxxx xxxx`)

---

### Step 4: Update CORS Configuration (CRITICAL)

Your current CORS only allows `localhost`. We need to add your Vercel domain:

**File to modify**: `backend/server.js` (line 17-23)

**Current code**:
```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-App-Check']
};
```

**Updated code** (see CORS_FIX.md for implementation):
```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-App-Check']
};
```

---

### Step 5: Verify Deployment

After Render redeploys:

1. **Check Logs**:
   - Go to "Logs" tab in Render
   - Look for:
   ```
   ✅ Connected to MongoDB
   🚀 Server running on port 10000
   ```

2. **Test Health Endpoint**:
   - Visit: `https://your-backend.onrender.com/api/health`
   - Should return:
   ```json
   {
     "status": "OK",
     "timestamp": "2025-10-25T...",
     "environment": "production"
   }
   ```

3. **Common Issues**:
   - ❌ **Still connection refused**: Check MongoDB Atlas Network Access (allow 0.0.0.0/0)
   - ❌ **Authentication failed**: Verify username/password in MONGO_URI
   - ❌ **CORS errors**: Make sure FRONTEND_URL is set and code is updated

---

### Step 6: Update Vercel Frontend

Once backend is running:

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your frontend project**
3. **Settings** → **Environment Variables**
4. **Add**:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend.onrender.com` (your Render backend URL)
5. **Click "Save"**
6. **Deployments** → Click "Redeploy" on latest deployment

---

## Quick Reference

### MongoDB Atlas Checklist
- ✅ Created free M0 cluster
- ✅ Added database user with password
- ✅ Allowed access from anywhere (0.0.0.0/0)
- ✅ Copied connection string with database name

### Render Environment Variables Checklist
- ✅ `MONGO_URI` (MongoDB Atlas connection string)
- ✅ `JWT_SECRET` (random 32+ character string)
- ✅ `NODE_ENV` = `production`
- ✅ `SMTP_USER`, `SMTP_PASS`, `USE_GMAIL`, `SMTP_SECURE`, `SMTP_PORT`, `MAIL_FROM`
- ✅ `FRONTEND_URL` (Vercel URL)

### Code Changes Checklist
- ✅ Updated CORS to use `FRONTEND_URL` in production
- ✅ Pushed changes to GitHub
- ✅ Render auto-deployed

### Vercel Configuration
- ✅ Added `VITE_API_URL` environment variable
- ✅ Redeployed frontend

---

## Expected Timeline

1. **MongoDB Setup**: 5-10 minutes
2. **Gmail App Password**: 2 minutes
3. **Render Configuration**: 3-5 minutes
4. **Render Auto-Redeploy**: 2-3 minutes
5. **Code Update & Push**: 2 minutes
6. **Vercel Update**: 2 minutes

**Total**: ~15-25 minutes

---

## Need Help?

- **MongoDB Issues**: https://www.mongodb.com/docs/atlas/
- **Render Logs**: Check "Logs" tab in your service
- **Gmail App Passwords**: https://support.google.com/accounts/answer/185833
- **CORS Errors**: Verify `FRONTEND_URL` matches your Vercel domain exactly

---

🎉 Once complete, your full-stack app will be live!
