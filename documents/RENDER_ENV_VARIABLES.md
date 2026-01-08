# 🔧 Render Environment Variables - COPY & PASTE

## Your MongoDB Connection String (Fixed)

Your original string:
```
mongodb+srv://alex:alex@cluster0.8nddloo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

**Fixed version** (added database name `ecardamom`):
```
mongodb+srv://alex:alex@cluster0.8nddloo.mongodb.net/ecardamom?retryWrites=true&w=majority&appName=Cluster0
```

⚠️ **Note**: If your MongoDB Atlas password is actually "alex", you should change it to something more secure!

---

## 📋 Copy These to Render Environment Tab

Go to: **Render Dashboard → Your Backend Service → Environment Tab**

### Required Variables (Copy these exactly):

```
MONGO_URI=mongodb+srv://alex:alex@cluster0.8nddloo.mongodb.net/ecardamom?retryWrites=true&w=majority&appName=Cluster0

NODE_ENV=production

JWT_SECRET=sk_e8f7d6c5b4a3f2e1d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1

USE_GMAIL=true

SMTP_SECURE=true

SMTP_PORT=465
```

### Variables YOU Need to Fill In:

```
SMTP_USER=your-email@gmail.com

SMTP_PASS=xxxx xxxx xxxx xxxx

MAIL_FROM=your-email@gmail.com

FRONTEND_URL=https://your-app-name.vercel.app
```

---

## 🔑 How to Get Gmail App Password (2 minutes)

1. **Go to**: https://myaccount.google.com/apppasswords
2. **Enable 2-Step Verification** (if not already enabled)
3. **Create App Password**:
   - App: Mail
   - Device: Other → Type "E-Cardamom Backend"
4. **Click Generate**
5. **Copy the 16-character password** (format: `xxxx xxxx xxxx xxxx`)
6. **Use this as `SMTP_PASS`**

---

## 🌐 Get Your Vercel Frontend URL

1. Go to: https://vercel.com/dashboard
2. Find your deployed frontend project
3. Copy the URL (e.g., `https://e-cardamom-connect.vercel.app`)
4. Use this as `FRONTEND_URL` (no trailing slash!)

---

## ✅ Step-by-Step in Render

### 1. Open Environment Tab
Render Dashboard → Select your backend service → **Environment** tab

### 2. Add Each Variable
Click "**Add Environment Variable**" for each one:

| Key | Value |
|-----|-------|
| `MONGO_URI` | `mongodb+srv://alex:alex@cluster0.8nddloo.mongodb.net/ecardamom?retryWrites=true&w=majority&appName=Cluster0` |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | `sk_e8f7d6c5b4a3f2e1d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1` |
| `USE_GMAIL` | `true` |
| `SMTP_USER` | **YOUR_GMAIL@gmail.com** |
| `SMTP_PASS` | **YOUR_APP_PASSWORD** (from step above) |
| `SMTP_SECURE` | `true` |
| `SMTP_PORT` | `465` |
| `MAIL_FROM` | **YOUR_GMAIL@gmail.com** (same as SMTP_USER) |
| `FRONTEND_URL` | **YOUR_VERCEL_URL** |

### 3. Save Changes
Click "**Save Changes**" button at the top

### 4. Automatic Redeploy
Render will automatically redeploy your backend with new environment variables

---

## 📊 Monitor Deployment

### Watch the Logs
Go to **Logs** tab in Render

**Look for these success messages**:
```
✅ Connected to MongoDB
🚀 Server running on port 10000
✅ Feedback indexes ensured
✅ OrderRequest indexes ensured
```

**If you see errors**, check the troubleshooting section below.

---

## 🧪 Test Your Backend

### 1. Health Check
Once deployed, visit:
```
https://your-backend-name.onrender.com/api/health
```

**Expected response**:
```json
{
  "status": "OK",
  "timestamp": "2025-10-25T...",
  "environment": "production"
}
```

### 2. Check MongoDB Connection
If health check works, your MongoDB is connected! ✅

---

## 🐛 Troubleshooting

### Error: "MongoServerError: bad auth"
**Cause**: Wrong username or password
**Fix**: 
- Go to MongoDB Atlas → Database Access
- Verify username is "alex"
- Click "Edit" on user → Reset password if needed
- Update `MONGO_URI` in Render with new password

### Error: "MongoServerSelectionError: connection timed out"
**Cause**: IP not whitelisted
**Fix**:
- Go to MongoDB Atlas → Network Access
- Make sure `0.0.0.0/0` is in the list (Allow access from anywhere)
- Wait 2 minutes for changes to propagate

### Error: "Nodemailer SMTP error"
**Cause**: Wrong Gmail password or App Password not created
**Fix**:
- Make sure you're using **App Password**, NOT your regular Gmail password
- Verify 2-Step Verification is enabled
- Regenerate App Password if needed

### Error: "CORS policy blocks request"
**Cause**: `FRONTEND_URL` not set or incorrect
**Fix**:
- Verify `FRONTEND_URL` exactly matches your Vercel domain
- No trailing slash: ✅ `https://app.vercel.app` ❌ `https://app.vercel.app/`
- Push the CORS fix code (see next section)

---

## 📤 Push Code Changes to GitHub

The CORS fix is ready in your code. Push it:

```bash
git status
git add .
git commit -m "Fix: Configure backend for Render with MongoDB Atlas and CORS"
git push origin main
```

Render will detect the push and redeploy automatically.

---

## 🔐 Security Recommendations

### Change Default Password
Your MongoDB password "alex" is too simple. To change it:

1. **MongoDB Atlas** → **Database Access**
2. **Edit User** "alex"
3. **Edit Password** → **Autogenerate Secure Password**
4. **Copy the new password**
5. **Update Password** button
6. **Update `MONGO_URI` in Render** with new password

### Generate Stronger JWT Secret
Current: `sk_e8f7d6c5b4a3f2e1d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1`

Generate random one:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then update `JWT_SECRET` in Render.

---

## ⏱️ Timeline

- ✅ MongoDB connection string ready (Done!)
- ⏱️ Get Gmail App Password: 2 minutes
- ⏱️ Add environment variables to Render: 3 minutes
- ⏱️ Render auto-redeploy: 2-3 minutes
- ⏱️ Push code to GitHub: 1 minute
- ⏱️ Second Render redeploy: 2-3 minutes
- ⏱️ Update Vercel with backend URL: 2 minutes

**Total**: ~12-15 minutes

---

## ✅ Checklist

- [ ] MongoDB connection string has database name (`/ecardamom`)
- [ ] Created Gmail App Password
- [ ] Added all 10 environment variables to Render
- [ ] Clicked "Save Changes" in Render
- [ ] Watched logs for "✅ Connected to MongoDB"
- [ ] Tested `/api/health` endpoint
- [ ] Pushed CORS fix to GitHub
- [ ] Updated `VITE_API_URL` in Vercel
- [ ] Redeployed Vercel frontend
- [ ] Tested full app (login, features work)

---

🎉 **You're almost done!** Add the environment variables to Render and your backend will be live in minutes!
