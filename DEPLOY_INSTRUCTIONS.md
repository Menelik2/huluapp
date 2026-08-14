# KuluApp - Deployment Instructions

## What Has Been Done

| Step | Status |
|------|--------|
| Web frontend deployed on Vercel | Done - https://kuluapp.vercel.app |
| Firebase config set | Done |
| Database credentials configured | Done |
| Admin email set | Done - linuxos777@gmail.com |
| APP_KEY generated | Done - base64:ktxcf+PFFVzWapBpkUqCxcMnp2P5eKETpJPwYEclgNE= |
| .env file prepared | Done |

## What You Need To Do

### 1. Install PHP Dependencies (On YOUR Computer)

This environment doesn't have PHP. You must run this on your local machine:

```bash
# 1. Download the repo
git clone https://github.com/Menelik2/huluapp.git
cd huluapp/cPanel_YegaraHost/kulu_core

# 2. Install Composer dependencies
composer install --no-dev --optimize-autoloader

# This creates the vendor/ folder
```

**If you don't have Composer:**
- Windows: Download from https://getcomposer.org/download/
- Mac: `brew install composer`
- Linux: `sudo apt install composer`

### 2. Upload Everything to InfinityFree

Upload these folders/files to InfinityFree File Manager → `htdocs/`:

```
app/
bootstrap/
config/
database/
routes/
storage/
vendor/          <-- From composer install
.env             <-- Already configured
composer.json
```

### 3. Import Database

1. InfinityFree → phpMyAdmin
2. Select: `if0_42274082_kulu_db`
3. Import tab → Choose `database_sql/kulu_database_full.sql`
4. Click Go

### 4. Upload Firebase Service Account

1. Firebase Console → kuluapps → Settings → Service Accounts
2. Generate new private key
3. Rename to: `kuluapps-firebase-adminsdk.json`
4. Upload to: `htdocs/storage/firebase/`

### 5. Set Folder Permissions

In InfinityFree File Manager:
- `storage/` → 755
- `bootstrap/cache/` → 755
- `storage/app/public/` → 755

### 6. Test Your API

Visit: https://kulu.xo.je/api/products

If you see JSON data, everything works!

## Your Configured URLs

| Service | URL |
|---------|-----|
| Web Shop | https://kuluapp.vercel.app |
| Admin Panel | https://kuluapp.vercel.app/admin |
| API | https://kulu.xo.je/api |
| API Test | https://kulu.xo.je/api/products |

## Firebase Settings (Already Done)

- [x] Web API Key configured
- [x] Web App ID configured
- [x] Admin email: linuxos777@gmail.com
- [ ] Add kuluapp.vercel.app to Firebase authorized domains (YOU do this)
- [ ] Enable Google Sign-In in Firebase (YOU do this)

## Troubleshooting

| Problem | Solution |
|---------|----------|
| 500 Error | Check .env APP_KEY is set |
| Database error | Check DB credentials in .env |
| CORS error | Add kuluapp.vercel.app to Laravel CORS |
| Login fails | Add kuluapp.vercel.app to Firebase authorized domains |
| Images missing | Run `php artisan storage:link` or check permissions |
