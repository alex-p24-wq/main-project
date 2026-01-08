# Vercel Deployment for Frontend

## Quick Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to [Vercel](https://vercel.com/)**
2. **Sign in** with your GitHub account
3. **Import your repository**:
   - Click "Add New" → "Project"
   - Select your GitHub repository
   - Vercel will auto-detect it's a Vite project

4. **Configure Build Settings**:
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

5. **Add Environment Variables** (if needed):
   - Go to Project Settings → Environment Variables
   - Add:
     ```
     VITE_API_URL=https://your-backend-url.com/api
     VITE_RAZORPAY_KEY_ID=your_razorpay_key
     ```

6. **Deploy**: Click "Deploy"

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from frontend directory**:
   ```bash
   cd frontend
   vercel
   ```

4. **Follow the prompts**:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - What's your project's name? **e-cardamom-connect**
   - In which directory is your code located? **./**
   - Want to override the settings? **N**

5. **Deploy to production**:
   ```bash
   vercel --prod
   ```

## Environment Variables for Vercel

Add these in Vercel Dashboard → Project Settings → Environment Variables:

```env
# API Backend URL (REQUIRED)
VITE_API_URL=https://your-backend-url.com/api

# Razorpay (if using payments)
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id

# Google OAuth (if using)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## Important Notes

### 1. API URL Configuration
Your frontend will connect to the backend API. Make sure to:
- Deploy your backend separately (Railway, Render, Heroku, etc.)
- Update `VITE_API_URL` with your backend URL
- Enable CORS in backend for your Vercel domain

### 2. Backend CORS Configuration
In your `backend/server.js`, update CORS:

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-vercel-app.vercel.app',
    'https://your-custom-domain.com'
  ],
  credentials: true
}));
```

### 3. Build Output
- Vercel will automatically build your frontend
- Build output goes to `frontend/dist/`
- Vercel serves this as static files

### 4. Automatic Deployments
- Every push to main/master branch triggers auto-deployment
- Pull requests get preview deployments
- Configure in Vercel Dashboard → Git settings

## Custom Domain

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Vercel provides free SSL certificates

## Troubleshooting

### Build Fails
- Check build logs in Vercel Dashboard
- Ensure all dependencies are in `package.json`
- Verify Node version compatibility

### API Connection Issues
- Check `VITE_API_URL` is set correctly
- Verify backend CORS configuration
- Check backend is accessible from internet

### 404 on Refresh
- The `vercel.json` file handles this with rewrites
- All routes redirect to `/index.html` for client-side routing

## Vercel CLI Commands

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs

# Remove deployment
vercel remove [deployment-url]
```

## Project Structure for Vercel

```
mini-project/
├── frontend/              ← Deploy this directory
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json        ← Vercel configuration
```

## Next Steps After Deployment

1. ✅ Frontend deployed on Vercel
2. 🔄 Deploy backend (Railway/Render/Heroku)
3. 🔗 Update `VITE_API_URL` in Vercel env variables
4. 🔒 Configure CORS in backend
5. ✉️ Update email templates with production URLs
6. 🧪 Test all features in production

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
