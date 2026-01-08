# 🚀 Vercel Deployment - Step by Step Guide

## ✅ Pre-Deployment Checklist

### 1. Code Preparation
- [x] All code committed to Git
- [ ] All tests passing
- [ ] No console errors in browser
- [ ] Build succeeds locally (`npm run build`)
- [ ] Preview build works (`npm run preview`)

### 2. Environment Setup
- [ ] Backend API deployed (Railway/Render/Heroku)
- [ ] Backend URL accessible
- [ ] CORS configured for Vercel domain
- [ ] Database connection working
- [ ] Email service configured

### 3. Configuration Files
- [x] `vercel.json` created
- [x] `vite.config.js` updated
- [x] `.env.example` created
- [x] `.gitignore` updated
- [x] `README.md` updated

## 📋 Deployment Steps

### Step 1: Deploy Backend First

**Before deploying frontend, ensure backend is live!**

Recommended platforms:
- **Railway**: Easy Node.js hosting
- **Render**: Free tier available
- **Heroku**: Established platform
- **DigitalOcean**: More control

Get your backend URL (e.g., `https://your-api.railway.app`)

### Step 2: Prepare Frontend

1. **Update environment variables**
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. **Edit `.env` file**
   ```env
   VITE_API_URL=https://your-backend-url.com/api
   VITE_RAZORPAY_KEY_ID=your_production_key
   ```

3. **Test locally with production API**
   ```bash
   npm run dev
   ```
   Verify all features work with production backend

4. **Build and test**
   ```bash
   npm run build
   npm run preview
   ```

### Step 3: Push to GitHub

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### Step 4: Deploy to Vercel

#### Option A: Via Dashboard (Recommended for first time)

1. **Go to** [vercel.com](https://vercel.com)

2. **Sign in** with GitHub

3. **Import Project**
   - Click "Add New" → "Project"
   - Select "Import Git Repository"
   - Find and select your repository

4. **Configure Project**
   ```
   Project Name: e-cardamom-connect
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   Node Version: 18.x (or latest LTS)
   ```

5. **Add Environment Variables**
   Click "Environment Variables" and add:
   ```
   Name: VITE_API_URL
   Value: https://your-backend-url.com/api
   
   Name: VITE_RAZORPAY_KEY_ID
   Value: rzp_live_xxxxxxxxxxxxx
   ```

6. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (2-5 minutes)
   - Get deployment URL: `https://your-project.vercel.app`

#### Option B: Via CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel

# Follow prompts:
# - Set up new project
# - Select scope (your account)
# - Link to new project
# - Override settings: N
```

### Step 5: Configure Backend CORS

Update your backend to allow Vercel domain:

```javascript
// backend/server.js
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-project.vercel.app',
    'https://your-custom-domain.com' // if you have one
  ],
  credentials: true
}));
```

Redeploy backend after CORS update.

### Step 6: Test Production Deployment

Visit your Vercel URL and test:
- [ ] Homepage loads
- [ ] Login works
- [ ] Registration works
- [ ] API calls succeed
- [ ] Images load
- [ ] Payment integration works
- [ ] Email notifications work
- [ ] All dashboards accessible
- [ ] No console errors

### Step 7: Add Custom Domain (Optional)

1. **In Vercel Dashboard**
   - Go to Project Settings → Domains
   - Click "Add Domain"
   - Enter your domain: `www.yoursite.com`

2. **Configure DNS**
   - Add CNAME record:
     ```
     Type: CNAME
     Name: www
     Value: cname.vercel-dns.com
     ```
   
   - For root domain, add A record:
     ```
     Type: A
     Name: @
     Value: 76.76.21.21 (Vercel's IP)
     ```

3. **Wait for DNS propagation** (15 mins - 48 hours)

4. **SSL Certificate**
   - Vercel automatically provisions SSL
   - HTTPS enabled automatically

## 🔄 Continuous Deployment

Once set up, Vercel automatically deploys:
- **Main branch** → Production
- **Other branches** → Preview deployments
- **Pull Requests** → Preview deployments with unique URLs

To disable auto-deploy:
- Go to Project Settings → Git → Disable

## 🛠️ Post-Deployment

### Update Email Templates
If emails contain frontend URLs, update them:
```javascript
// backend/utils/emailService.js
const FRONTEND_URL = 'https://your-project.vercel.app';
```

### Monitor Performance
- Check Vercel Analytics
- Monitor build times
- Check error logs

### Set up Monitoring
- Vercel Analytics (built-in)
- Google Analytics
- Sentry for error tracking

## 📊 Environment Variables Reference

### Required
```env
VITE_API_URL=https://your-backend-url.com/api
```

### Optional
```env
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
VITE_GOOGLE_CLIENT_ID=xxxxxxxxxxxxx.apps.googleusercontent.com
VITE_FIREBASE_API_KEY=xxxxxxxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

### Adding Variables in Vercel
1. Project Settings → Environment Variables
2. Add variable
3. Select environments: Production, Preview, Development
4. Save
5. Redeploy for changes to take effect

## 🔧 Common Issues & Solutions

### Issue: Build Fails
**Solution:**
- Check build logs in Vercel
- Ensure all dependencies in `package.json`
- Try building locally first
- Check Node version compatibility

### Issue: API Calls Fail (CORS Error)
**Solution:**
- Add Vercel domain to backend CORS whitelist
- Check `VITE_API_URL` is correct
- Verify backend is accessible

### Issue: 404 on Page Refresh
**Solution:**
- Ensure `vercel.json` is in frontend directory
- Check rewrites configuration
- Redeploy

### Issue: Environment Variables Not Working
**Solution:**
- Variables must start with `VITE_`
- Add in Vercel dashboard
- Trigger new deployment after adding

### Issue: Slow Build Times
**Solution:**
- Enable dependency caching
- Use `pnpm` instead of `npm`
- Optimize `vite.config.js`

## 📈 Performance Optimization

### Before Deployment
- [ ] Optimize images (compress, use WebP)
- [ ] Remove unused dependencies
- [ ] Enable code splitting
- [ ] Add lazy loading for routes
- [ ] Minify CSS/JS

### Vercel Optimizations
- [ ] Enable compression (automatic)
- [ ] Configure caching headers
- [ ] Use Vercel CDN (automatic)
- [ ] Enable image optimization

## 🎯 Success Criteria

Your deployment is successful when:
- ✅ Build completes without errors
- ✅ Site loads on Vercel URL
- ✅ All pages accessible
- ✅ API calls work
- ✅ Authentication works
- ✅ Payment integration works
- ✅ No console errors
- ✅ Mobile responsive
- ✅ Fast loading (< 3 seconds)
- ✅ SSL certificate active

## 📞 Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [GitHub Issues](https://github.com/vercel/vercel/issues)

## 🎉 You're Done!

Your frontend is now live on Vercel! 🚀

**Next Steps:**
1. Share your URL with team/clients
2. Monitor performance
3. Collect feedback
4. Iterate and improve

---

**Deployment Date:** _______________  
**Vercel URL:** _______________  
**Custom Domain:** _______________  
**Backend URL:** _______________
