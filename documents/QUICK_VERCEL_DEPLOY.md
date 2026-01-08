# ⚡ Quick Vercel Backend Deployment

**5-Minute Setup Guide**

---

## 🚀 Step 1: Go to Vercel Dashboard

👉 https://vercel.com/dashboard

Click: **"Add New"** → **"Project"**

---

## 📂 Step 2: Import Repository

- Select: `alex-p24-wq/mini-project`
- Click: **"Import"**

---

## ⚙️ Step 3: Configure Settings

```
Framework Preset:    Other
Root Directory:      backend
Build Command:       (leave empty)
Output Directory:    (leave empty)
Install Command:     npm install
Node.js Version:     20.x
```

---

## 🔐 Step 4: Add Environment Variables

Click **"Environment Variables"** and add these:

```bash
MONGO_URI=mongodb+srv://alex:alex@cluster0.8nddloo.mongodb.net/ecardamom?retryWrites=true&w=majority&appName=Cluster0

JWT_SECRET=change_this_to_a_random_long_string_for_security

NODE_ENV=production

USE_GMAIL=true
SMTP_SECURE=true
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
MAIL_FROM=your-email@gmail.com

FRONTEND_URL=http://localhost:5173
```

**⚠️ Important:**
- Replace `your-email@gmail.com` with your actual Gmail
- Replace `your-gmail-app-password` with 16-char Gmail App Password
- Get App Password: https://myaccount.google.com/apppasswords

---

## ✅ Step 5: Deploy

Click **"Deploy"** → Wait 2-3 minutes

---

## 🧪 Step 6: Test

Your backend URL: `https://mini-project-xxxxx.vercel.app`

Test health endpoint:
```bash
curl https://your-url.vercel.app/api/health
```

Should return:
```json
{"status":"OK","timestamp":"...","environment":"production"}
```

---

## 🔄 Step 7: Update FRONTEND_URL (After Frontend Deploy)

1. Go to Vercel → Your Backend → **Settings** → **Environment Variables**
2. Edit `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://your-frontend.vercel.app
   ```
3. Click **"Save"**
4. Go to **Deployments** → Click **"Redeploy"**

---

## 📝 MongoDB Atlas Quick Setup

1. Go to: https://cloud.mongodb.com
2. **Network Access** → **Add IP Address**
3. Select: **"Allow Access from Anywhere"** (`0.0.0.0/0`)
4. Click **"Confirm"**

---

## ✨ Done!

Your backend is now live! 🎉

**Next:** Deploy your frontend and update `FRONTEND_URL`

---

**Need detailed help?** See: `VERCEL_BACKEND_SETUP_FRESH.md`
