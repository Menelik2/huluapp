# Kulu Web — GitHub + Vercel Deployment Guide

Static SPA frontend for Kulu Online Shopping. Deploys to Vercel in minutes.

## What's Inside

| File | Purpose |
|------|---------|
| `index.html` | Customer app (shop, cart, orders, chat) |
| `admin/index.html` | Admin dashboard (analytics, products, orders, chat) |
| `config.js` | API + Firebase + Pusher configuration |
| `echo.js` | Laravel Echo real-time chat bootstrap |
| `vercel.json` | Vercel routing rules (SPA support) |

## Prerequisites

1. **Laravel API already deployed** (cPanel, VPS, or any host with HTTPS)
2. **Firebase project** with Google Sign-In enabled
3. **Pusher account** (optional, for real-time chat)
4. **GitHub account**
5. **Vercel account** (free, sign up with GitHub)

---

## Step 1: Configure `config.js`

Open `config.js` and replace all placeholder values:

```js
window.KULU_CONFIG = {
  // Your Laravel API URL (must end with /api)
  // Example: https://api.kulu.app/api
  API_BASE_URL: 'https://YOUR-API-DOMAIN.com/api',

  // Firebase Web App config
  // Get from: Firebase Console → Project Settings → Your Apps → Web
  FIREBASE: {
    apiKey: 'your-actual-api-key',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project-id',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abcdef123456',
  },

  // Pusher (same keys as your Laravel API .env)
  // Skip this if you don't need real-time chat
  PUSHER: {
    key: 'your-pusher-key',
    cluster: 'mt1',
  },
};
```

### Where to find these values

| Value | Where to get it | Status |
|-------|-----------------|--------|
| `API_BASE_URL` | Your Laravel API domain + `/api` | **You fill this** |
| `apiKey` | Firebase Web SDK | ✅ Pre-filled |
| `appId` | Firebase Web SDK | ✅ Pre-filled |
| `authDomain` | `kuluapps.firebaseapp.com` | ✅ Pre-filled |
| `projectId` | `kuluapps` | ✅ Pre-filled |
| `storageBucket` | `kuluapps.firebasestorage.app` | ✅ Pre-filled |
| `messagingSenderId` | `613404183294` | ✅ Pre-filled |
| Pusher key | Pusher Dashboard → App Keys | Optional |

> **Firebase is fully configured!** You only need to add your Laravel API URL.

---

## Step 2: Push to GitHub

```bash
# 1. Initialize git
git init

# 2. Add all files
git add .

# 3. Commit
git commit -m "Initial Kulu web deployment"

# 4. Create a new repo on GitHub (do NOT initialize with README)
#    Go to: https://github.com/new

# 5. Link and push
git remote add origin https://github.com/YOUR_USERNAME/kulu-web.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy on Vercel

### Option A: Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Import your `kulu-web` repository
4. Configure:
   - **Framework Preset:** `Other` (static site)
   - **Root Directory:** `./` (default)
   - **Build Command:** leave empty
   - **Output Directory:** leave empty
5. Click **Deploy**
6. Wait ~30 seconds, then visit your `.vercel.app` URL

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login (opens browser)
vercel login

# Deploy
vercel --prod
```

---

## Step 4: Add Custom Domain (Optional)

1. In Vercel Dashboard → your project → **Settings → Domains**
2. Add your domain (e.g., `shop.kulu.app`)
3. Follow Vercel's DNS instructions
4. Update `config.js` `API_BASE_URL` if your API also moved to a custom domain

---

## Step 5: Update API CORS

Make sure your Laravel API allows requests from your Vercel domain:

In `kulu_core/.env`:
```env
FRONTEND_URL=https://your-app.vercel.app
# Or your custom domain:
# FRONTEND_URL=https://shop.kulu.app
```

In `kulu_core/config/cors.php`:
```php
'allowed_origins' => [
    env('FRONTEND_URL', 'http://localhost'),
    'https://your-app.vercel.app',
],
```

Then run:
```bash
php artisan config:cache
```

---

## Project Structure

```
kulu-web/
├── index.html          # Customer SPA
├── admin/
│   └── index.html      # Admin SPA
├── config.js           # API & Firebase config
├── echo.js             # Laravel Echo chat
├── vercel.json         # Vercel routing
├── .gitignore
└── README.md           # This file
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Configure API" message | Edit `config.js` with real API_BASE_URL |
| "Login failed" / CORS errors | Add your Vercel domain to Laravel CORS config |
| Chat not real-time | Check Pusher key matches Laravel `.env` |
| Admin page 404 | `vercel.json` routes are set up — redeploy if changed |
| Images not loading | Check Laravel `APP_URL` and `storage:link` |

---

## Features

**Customer:**
- Google Sign-In (Firebase)
- Product catalog with categories
- Shopping cart with stock validation
- Order placement & history
- Chapa payment integration
- Live chat with admin

**Admin:**
- Dashboard with analytics
- Order management & status updates
- Product CRUD with image upload
- Category management
- Inventory control
- Customer list & chat

---

## Tech Stack

- React 18 (via CDN, no build step)
- Firebase Auth (Google Sign-In)
- Laravel API (Sanctum tokens)
- Pusher / Laravel Echo (real-time chat)
- Chapa (payment gateway)

---

## License

Private — for Kulu App use only.
