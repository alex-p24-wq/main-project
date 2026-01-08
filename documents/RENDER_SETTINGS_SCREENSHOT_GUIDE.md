# 📸 Render Settings - Visual Guide

## 🎯 Fix "Route Not Found" - Click-by-Click

---

## Step 1: Go to Render Dashboard

**URL**: https://dashboard.render.com/

![Dashboard](Dashboard View)
- You'll see a list of your services
- Find your backend service (e.g., "ecardamom-backend" or similar name)
- **CLICK** on it

---

## Step 2: Open Settings Tab

![Service Page](Service Overview)
- You'll see tabs at the top: **Events**, **Logs**, **Shell**, **Metrics**, **Settings**
- **CLICK** on **Settings** tab

---

## Step 3: Find Build & Deploy Section

![Settings Page](Settings Overview)
- Scroll down to find "**Build & Deploy**" section
- It's usually near the top after "General" section

---

## Step 4: Update Root Directory

### Current Settings (WRONG ❌):
```
┌─────────────────────────────────────────┐
│ Build & Deploy                          │
├─────────────────────────────────────────┤
│ Root Directory:                         │
│ ┌─────────────────────────────────────┐ │
│ │ .                                   │ │  ← WRONG!
│ └─────────────────────────────────────┘ │
│                                         │
│ Build Command:                          │
│ ┌─────────────────────────────────────┐ │
│ │ npm install                         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Start Command:                          │
│ ┌─────────────────────────────────────┐ │
│ │ node server.js                      │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Update To (CORRECT ✅):
```
┌─────────────────────────────────────────┐
│ Build & Deploy                          │
├─────────────────────────────────────────┤
│ Root Directory:                         │
│ ┌─────────────────────────────────────┐ │
│ │ backend                             │ │  ← CHANGE TO THIS!
│ └─────────────────────────────────────┘ │
│                                         │
│ Build Command:                          │
│ ┌─────────────────────────────────────┐ │
│ │ npm install                         │ │  ← Keep as is
│ └─────────────────────────────────────┘ │
│                                         │
│ Start Command:                          │
│ ┌─────────────────────────────────────┐ │
│ │ node server.js                      │ │  ← Keep as is
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Actions**:
1. **CLICK** in the "Root Directory" text field
2. **DELETE** the current value (`.` or empty)
3. **TYPE**: `backend`
4. **Leave** Build Command as `npm install`
5. **Leave** Start Command as `node server.js`

---

## Step 5: Save Changes

![Save Button](Bottom of Settings)
- **Scroll to the bottom** of the Settings page
- You'll see a blue button: **"Save Changes"**
- **CLICK** "Save Changes"

---

## Step 6: Wait for Auto-Redeploy

![Deployment Progress](Events Tab)
- Render will automatically start redeploying
- A notification will appear: "Your service is being deployed"
- **CLICK** on **"Events"** tab to watch progress

**You'll see**:
```
⏳ Deploying...
📦 Installing dependencies
🏗️ Building...
🚀 Starting service...
✅ Live
```

**Wait 2-3 minutes** for deployment to complete.

---

## Step 7: Verify Success

### A. Check Logs

![Logs Tab](Logs View)
- **CLICK** on **"Logs"** tab

**You should see**:
```
✅ Connected to MongoDB
🚀 Server running on port 10000
📧 Environment: production
✅ Feedback indexes ensured
✅ OrderRequest indexes ensured
```

**NOT**:
```
❌ Error: Cannot find module '/opt/render/project/src/server.js'
❌ Route not found
```

### B. Test Health Endpoint

1. Find your service URL (top of Render dashboard)
   - Example: `https://ecardamom-backend.onrender.com`

2. Open in browser: `https://YOUR-SERVICE.onrender.com/api/health`

**Expected Response**:
```json
{
  "status": "OK",
  "timestamp": "2025-10-25T12:34:56.789Z",
  "environment": "production"
}
```

---

## 🎨 Visual Diagram

```
Before Fix (❌):
┌─────────────────────────────────────┐
│ Render is looking here:            │
│ /opt/render/project/src/           │  ← Root directory
│ └── server.js (NOT FOUND!)         │  ← Trying to run this
│                                     │
│ But your actual structure:          │
│ /opt/render/project/src/           │
│ ├── backend/                       │
│ │   └── server.js (HERE!)          │  ← File is actually here
│ └── frontend/                      │
└─────────────────────────────────────┘

After Fix (✅):
┌─────────────────────────────────────┐
│ Render is looking here:            │
│ /opt/render/project/src/backend/   │  ← Root directory = backend
│ └── server.js (FOUND!)             │  ← Can run this now!
└─────────────────────────────────────┘
```

---

## 📋 Settings Checklist

After updating, your settings should look like:

| Setting | Value | Status |
|---------|-------|--------|
| **Environment** | Node | ✅ |
| **Branch** | main | ✅ |
| **Root Directory** | `backend` | ✅ **CHANGED** |
| **Build Command** | `npm install` | ✅ |
| **Start Command** | `node server.js` | ✅ |

---

## 🔧 Environment Variables Section

While you're in Settings, scroll down to **"Environment Variables"**.

**Verify these are set**:

| Variable | Set? | Required |
|----------|------|----------|
| `MONGO_URI` | ✅ | YES |
| `JWT_SECRET` | ✅ | YES |
| `NODE_ENV` | ✅ | YES (value: `production`) |
| `USE_GMAIL` | ✅ | YES (value: `true`) |
| `SMTP_USER` | ✅ | YES |
| `SMTP_PASS` | ✅ | YES |
| `SMTP_SECURE` | ✅ | YES (value: `true`) |
| `SMTP_PORT` | ✅ | YES (value: `465`) |
| `MAIL_FROM` | ✅ | YES |
| `FRONTEND_URL` | ✅ | YES |

If any are missing, add them now!

---

## 🚨 Common Mistakes

### ❌ **Mistake 1**: Root Directory set to `./backend`
**Correct**: `backend` (no `./`)

### ❌ **Mistake 2**: Root Directory has trailing slash `backend/`
**Correct**: `backend` (no trailing `/`)

### ❌ **Mistake 3**: Start Command is `npm start`
**Note**: This works too, but `node server.js` is more explicit

### ❌ **Mistake 4**: Forgot to click "Save Changes"
**Fix**: Always click Save Changes at bottom!

---

## ⏱️ Timeline

- **Step 1-4** (Update settings): 1 minute
- **Step 5** (Save): 5 seconds
- **Step 6** (Auto-redeploy): 2-3 minutes
- **Step 7** (Verify): 30 seconds

**Total**: ~4 minutes

---

## 🎉 Success Indicators

✅ Logs show: "✅ Connected to MongoDB"
✅ Logs show: "🚀 Server running on port 10000"
✅ `/api/health` returns 200 OK with JSON
✅ No "Route not found" errors
✅ Service status shows "Live" (green)

---

## 📞 Still Not Working?

If you still see "Route not found" after this:

1. **Clear Build Cache**:
   - Settings → Manual Deploy → "Clear build cache & deploy"

2. **Check Logs** for specific error messages
   - Copy the error and search for it

3. **Verify File Structure**:
   - Make sure `backend/server.js` exists in your GitHub repo
   - Make sure `backend/package.json` exists

4. **Try Manual Deploy**:
   - Settings → Manual Deploy → "Deploy latest commit"

---

✅ **This should fix your "Route not found" error!**

The key is setting **Root Directory** to `backend`.
