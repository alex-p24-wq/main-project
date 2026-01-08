# 🔧 Render "Route Not Found" Fix

## 🔴 Problem
Your Render backend shows "Route not found" because Render is running from the **root directory** instead of the **backend directory**.

**What's happening**:
```
Root Directory (/)
├── backend/          ← Your server.js is HERE
│   └── server.js
├── frontend/
└── package.json      ← Render is running from HERE (wrong!)
```

When Render runs `node server.js` from root, it can't find the file because it's in `backend/server.js`.

---

## ✅ Solution: Configure Render Root Directory

### **Option 1: Update Render Service Settings (QUICKEST)** ⚡

1. **Go to Render Dashboard**: https://dashboard.render.com/
2. **Select your backend service**
3. **Settings** tab
4. Scroll to **Build & Deploy** section

**Update these settings**:

| Setting | Current Value | New Value |
|---------|---------------|-----------|
| **Root Directory** | `.` or `(empty)` | `backend` |
| **Build Command** | `npm install` | `npm install` |
| **Start Command** | `node server.js` | `node server.js` |

5. **Click "Save Changes"**
6. Render will automatically redeploy

---

### **Option 2: Use render.yaml (RECOMMENDED)** 📝

I've created a `render.yaml` file in your project root. This auto-configures everything.

**Steps**:

1. **Push render.yaml to GitHub**:
```bash
git add render.yaml
git commit -m "Add Render configuration file"
git push origin main
```

2. **In Render Dashboard**:
   - Go to your service
   - **Settings** → **Build & Deploy**
   - Check that it now shows:
     - Root Directory: `backend`
     - Build Command: `npm install`
     - Start Command: `node server.js`

3. **Redeploy** if needed (should happen automatically)

---

## 🧪 Verify It's Fixed

### 1. Check Render Logs

Go to **Logs** tab in your Render service.

**You should see**:
```
✅ Connected to MongoDB
🚀 Server running on port 10000
✅ Feedback indexes ensured
✅ OrderRequest indexes ensured
📧 Environment: production
```

**NOT**:
```
❌ Error: Cannot find module '/opt/render/project/src/server.js'
❌ Route not found
```

### 2. Test Health Endpoint

Visit your backend URL:
```
https://your-backend.onrender.com/api/health
```

**Expected Response**:
```json
{
  "status": "OK",
  "timestamp": "2025-10-25T...",
  "environment": "production"
}
```

### 3. Test API Routes

Try a specific route:
```
https://your-backend.onrender.com/api/auth/health
```

Should return 200 (or appropriate response), **NOT** 404.

---

## 🐛 Troubleshooting

### Still Getting "Route Not Found"?

**Check 1: Verify Root Directory**
- Render Dashboard → Your Service → **Settings**
- Under **Build & Deploy**, confirm **Root Directory** = `backend`

**Check 2: Check Logs for File Path**
- Look for the actual path Render is using
- Should be: `/opt/render/project/src/backend/server.js`
- NOT: `/opt/render/project/src/server.js`

**Check 3: Verify package.json Exists in Backend**
- Your `backend/package.json` should exist
- Contains `"start": "node server.js"`

**Check 4: Check Environment Variables**
- Ensure `MONGO_URI` is set (or you'll get MongoDB errors)
- Ensure `FRONTEND_URL` is set (for CORS)

---

### Getting "Cannot find module" errors?

**Cause**: Dependencies not installed in backend folder

**Fix**:
1. Verify **Build Command** = `npm install`
2. Check logs for "Installing dependencies" message
3. May need to clear Render cache:
   - Settings → Build & Deploy → **Manual Deploy** → **Clear build cache & deploy**

---

### Getting "Port already in use"?

**Cause**: Old process still running

**Fix**:
1. Render Dashboard → Your Service → **Manual Deploy** → **Deploy latest commit**
2. This forces a fresh start

---

## 📋 Current Configuration vs Required

### ❌ **Current (Wrong)**
```yaml
Root Directory: . (root)
Build Command: npm install
Start Command: node server.js
Result: ❌ Can't find server.js (it's in backend/)
```

### ✅ **Required (Correct)**
```yaml
Root Directory: backend
Build Command: npm install
Start Command: node server.js
Result: ✅ Finds backend/server.js correctly
```

---

## 🚀 After Fixing

Once the root directory is set to `backend`:

1. **Backend will start correctly** ✅
2. **All routes will work** ✅
3. **MongoDB will connect** (if MONGO_URI set) ✅
4. **CORS will allow Vercel** (if FRONTEND_URL set) ✅

---

## 📝 Quick Checklist

- [ ] Root Directory set to `backend` in Render
- [ ] Build Command is `npm install`
- [ ] Start Command is `node server.js`
- [ ] All environment variables added (MONGO_URI, JWT_SECRET, etc.)
- [ ] Service redeployed
- [ ] Logs show "✅ Connected to MongoDB"
- [ ] `/api/health` endpoint returns 200 OK
- [ ] Frontend can connect to backend

---

## 🎯 Step-by-Step Quick Fix (2 minutes)

1. **Open**: https://dashboard.render.com/
2. **Click**: Your backend service
3. **Click**: Settings tab
4. **Scroll to**: Build & Deploy section
5. **Change**: Root Directory from `.` to `backend`
6. **Click**: Save Changes (bottom of page)
7. **Wait**: 2-3 minutes for auto-redeploy
8. **Check**: Logs tab for success messages
9. **Test**: `https://your-backend.onrender.com/api/health`

---

## 📚 Related Files

- **`render.yaml`**: Auto-configuration for Render
- **`backend/server.js`**: Main server file (line 63: health endpoint, line 85: 404 handler)
- **`backend/package.json`**: Contains start script
- **`RENDER_ENV_VARIABLES.md`**: Environment variables setup

---

✅ **This fix should resolve your "Route not found" error immediately!**

After updating Root Directory to `backend`, your Render service will correctly locate and run `server.js`.
