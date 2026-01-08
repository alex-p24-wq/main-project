# ✅ Vercel Backend Deployment Checklist

Use this checklist to ensure everything is configured correctly before deploying.

---

## 📋 Pre-Deployment Checklist

### **1. Backend Files**

- [x] `backend/server.js` exists and exports `app`
- [x] `backend/package.json` has all dependencies
- [x] `backend/vercel.json` configured correctly
- [x] `backend/.env.example` created as template
- [x] All route files in `backend/routes/` have `export default router;`
- [x] No duplicate `export default` statements

### **2. MongoDB Atlas Setup**

- [ ] MongoDB Atlas cluster created
- [ ] Database name: `ecardamom`
- [ ] Network Access allows `0.0.0.0/0` (all IPs)
- [ ] Database user created with read/write permissions
- [ ] Connection string ready: `mongodb+srv://...`

### **3. Gmail App Password** (for OTP emails)

- [ ] Google 2-Step Verification enabled
- [ ] Gmail App Password generated (16 characters)
- [ ] App Password saved securely

### **4. Environment Variables Ready**

Copy these - you'll paste them in Vercel:

```bash
MONGO_URI=mongodb+srv://alex:alex@cluster0.8nddloo.mongodb.net/ecardamom?retryWrites=true&w=majority&appName=Cluster0

JWT_SECRET=CHANGE_THIS_TO_RANDOM_STRING_32_CHARS_OR_MORE

NODE_ENV=production

USE_GMAIL=true
SMTP_SECURE=true
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
MAIL_FROM=your-email@gmail.com

FRONTEND_URL=http://localhost:5173
```

**⚠️ Update before deploying:**
- [ ] Replace `JWT_SECRET` with strong random string
- [ ] Replace `SMTP_USER` with your Gmail
- [ ] Replace `SMTP_PASS` with your Gmail App Password
- [ ] Replace `MAIL_FROM` with your Gmail

---

## 🚀 Vercel Deployment Steps

### **Step 1: Import Project**

- [ ] Go to https://vercel.com/dashboard
- [ ] Click "Add New" → "Project"
- [ ] Select repository: `alex-p24-wq/mini-project`
- [ ] Click "Import"

### **Step 2: Configure Project**

```
Framework Preset:    Other
Root Directory:      backend
Build Command:       (leave empty)
Output Directory:    (leave empty)
Install Command:     npm install
Node.js Version:     20.x
```

- [ ] Root Directory set to `backend`
- [ ] Framework Preset set to `Other`
- [ ] Node.js version is 20.x
- [ ] Build/Output commands are empty

### **Step 3: Add Environment Variables**

- [ ] Click "Environment Variables" section
- [ ] Add all 10 environment variables from above
- [ ] Select "Production, Preview, and Development" for each
- [ ] Double-check no typos in variable names
- [ ] Verify MongoDB URI includes database name `ecardamom`

### **Step 4: Deploy**

- [ ] Click "Deploy" button
- [ ] Wait 2-3 minutes for deployment
- [ ] Check for green checkmark ✓

---

## 🧪 Post-Deployment Testing

### **Test 1: Health Check**

```bash
curl https://your-backend.vercel.app/api/health
```

**Expected:**
```json
{"status":"OK","timestamp":"...","environment":"production"}
```

- [ ] Returns 200 status
- [ ] Response contains `"status":"OK"`
- [ ] Environment is `production`

### **Test 2: Root Endpoint**

```bash
curl https://your-backend.vercel.app/
```

**Expected:**
```json
{
  "name": "E-Cardamom Connect API",
  "version": "1.0.0",
  "status": "running",
  ...
}
```

- [ ] Returns API information
- [ ] Lists available endpoints

### **Test 3: Test Auth Route**

```bash
curl https://your-backend.vercel.app/api/auth/mailer-status
```

- [ ] Returns mailer configuration
- [ ] No 500 errors

---

## 🔄 Update FRONTEND_URL (After Frontend Deployed)

- [ ] Frontend deployed and URL obtained
- [ ] Go to Vercel → Backend Project → Settings → Environment Variables
- [ ] Edit `FRONTEND_URL` variable
- [ ] Set to: `https://your-frontend.vercel.app` or `https://your-frontend.onrender.com`
- [ ] Save changes
- [ ] Go to Deployments → Click "Redeploy" on latest deployment

---

## 🎨 Frontend Configuration

- [ ] Create `frontend/.env` file
- [ ] Add: `VITE_API_URL=https://your-backend.vercel.app`
- [ ] Restart frontend dev server
- [ ] Test login/register functionality

---

## 🐛 Troubleshooting Checklist

### **If Health Check Fails (500 Error):**

- [ ] Check Vercel logs: Functions → View Function Logs
- [ ] Verify `MONGO_URI` is correct
- [ ] Check MongoDB Atlas Network Access allows `0.0.0.0/0`
- [ ] Verify all environment variables are set
- [ ] Check for typos in environment variable names

### **If CORS Errors Occur:**

- [ ] Verify `FRONTEND_URL` is set correctly
- [ ] Redeploy backend after updating `FRONTEND_URL`
- [ ] Check frontend is using correct backend URL

### **If MongoDB Connection Fails:**

- [ ] MongoDB Atlas Network Access allows `0.0.0.0/0`
- [ ] Database user has correct permissions
- [ ] Connection string includes `/ecardamom` database name
- [ ] Username and password are correct (no special characters issues)

---

## 📊 Verification Summary

| Check | Status | Notes |
|-------|--------|-------|
| Backend deployed | ⬜ | URL: _________________ |
| Health check passes | ⬜ | Returns 200 OK |
| MongoDB connected | ⬜ | Check Vercel logs |
| Environment vars set | ⬜ | All 10 variables |
| CORS configured | ⬜ | FRONTEND_URL set |
| Frontend updated | ⬜ | VITE_API_URL set |
| Login works | ⬜ | Test end-to-end |

---

## ✨ Final Checks

- [ ] Backend URL saved: `https://_________________.vercel.app`
- [ ] Frontend can reach backend (no CORS errors)
- [ ] Login/Register functionality works
- [ ] OTP emails are being sent
- [ ] All API endpoints respond correctly
- [ ] No 500 errors in Vercel logs

---

## 📞 Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **MongoDB Atlas:** https://cloud.mongodb.com
- **Detailed Guide:** See `VERCEL_BACKEND_SETUP_FRESH.md`
- **Quick Guide:** See `QUICK_VERCEL_DEPLOY.md`

---

**Deployment Date:** __________  
**Backend URL:** __________  
**Frontend URL:** __________  
**Deployed By:** __________
