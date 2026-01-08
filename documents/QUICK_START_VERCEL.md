# 🚀 Deploy to Vercel - 5 Minutes Quick Start

## Prerequisites
✅ GitHub account  
✅ Code pushed to GitHub  
✅ Backend API deployed and URL ready  

## Step 1: Import to Vercel (2 minutes)

1. **Go to** https://vercel.com/new

2. **Sign in** with GitHub

3. **Import your repository**
   - Click on your repository `E-Cardamom_connect`

4. **Configure settings**:
   ```
   Root Directory: frontend
   ```
   (Everything else auto-detected)

5. **Click "Deploy"** ✨

## Step 2: Add Environment Variables (1 minute)

After deployment, go to:
**Project Settings → Environment Variables**

Add:
```
VITE_API_URL
→ https://your-backend-url.com/api

VITE_RAZORPAY_KEY_ID  
→ your_razorpay_key
```

Click **Save** → **Redeploy**

## Step 3: Update Backend CORS (1 minute)

In your backend code (`backend/server.js`):

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-project-name.vercel.app'  // ← Add this
  ],
  credentials: true
}));
```

Redeploy your backend.

## Step 4: Test (1 minute)

Visit: `https://your-project-name.vercel.app`

Test:
- ✅ Page loads
- ✅ Login works
- ✅ API calls work

## 🎉 Done!

Your app is live on Vercel!

---

## 📱 Share Your App

Your URL: `https://your-project-name.vercel.app`

## 🔗 Add Custom Domain (Optional)

1. **Vercel Dashboard** → Domains
2. **Add** `www.yoursite.com`
3. **Update DNS** at your domain provider:
   ```
   CNAME: www → cname.vercel-dns.com
   ```

---

## 🆘 Need Help?

**Build fails?**
- Check logs in Vercel dashboard
- Ensure `frontend/` directory exists
- Run `npm run build` locally first

**API not working?**
- Check `VITE_API_URL` is correct
- Verify backend CORS includes Vercel URL
- Check backend is accessible

**Full guides available:**
- `VERCEL_DEPLOYMENT.md` - Complete guide
- `VERCEL_DEPLOYMENT_CHECKLIST.md` - Detailed checklist
- `frontend/README.md` - Frontend documentation

---

**That's it! Your app is live in 5 minutes! 🚀**
