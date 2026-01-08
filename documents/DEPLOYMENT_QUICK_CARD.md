# 🚀 Quick Deployment Card

## Backend → Vercel (Serverless)

### Deploy Steps:
1. **Import to Vercel**
   - Root Directory: `backend`
   - Framework: Other
   - Install Command: `npm install`

2. **Environment Variables** (Vercel Dashboard):
   ```
   NODE_ENV=production
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=your-secret
   SMTP_USER=gmail@gmail.com
   SMTP_PASS=app-password
   FRONTEND_URL=https://your-app.onrender.com
   ```

3. **Deploy & Test**
   - URL: `https://your-backend.vercel.app`
   - Test: `/api/health` endpoint

---

## Frontend → Render (Static Site)

### Deploy Steps:
1. **Create Static Site** (Render Dashboard)
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

2. **Environment Variables**:
   ```
   VITE_API_URL=https://your-backend.vercel.app
   ```

3. **Deploy & Test**
   - URL: `https://your-frontend.onrender.com`
   - Check browser console for API calls

---

## 🔄 Final Step: Update CORS

Go back to **Vercel** → Update `FRONTEND_URL`:
```
FRONTEND_URL=https://your-frontend.onrender.com
```
Then **redeploy** backend.

---

## ⚠️ Important Notes

### Vercel Serverless Limits:
- ❌ **File uploads may not work** (no persistent storage)
- ❌ **4.5MB request limit**
- ❌ **10-second timeout** (free tier)

### Solutions:
1. Use **Cloudinary** for image uploads
2. Or swap: Backend on Render, Frontend on Vercel
3. Or use Vercel Blob Storage (paid)

---

## 🎯 Recommended Setup

For this project with file uploads:
- **Backend:** Render Web Service (persistent storage)
- **Frontend:** Vercel (fast CDN, better for static sites)

Want to switch? I can help with that!

---

## 📊 Current Setup

```
Browser
   ↓
Frontend (Render Static) → Backend (Vercel Serverless) → MongoDB Atlas
```

### Pros:
✅ Free tier available
✅ Auto-scaling
✅ Fast deployment

### Cons:
❌ No file storage on Vercel
❌ Serverless cold starts
❌ Request size limits

---

## 🆘 Quick Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS errors | Update `FRONTEND_URL` in Vercel & redeploy |
| 404 on routes | Check `backend/vercel.json` routes |
| Build fails | Check build logs, verify dependencies |
| API not found | Verify `VITE_API_URL` in Render |
| File upload fails | Use Cloudinary or external storage |

---

**Need the reverse setup?** 
Run: "I want backend on Render and frontend on Vercel"
