# InfinityFree Deployment Files

These files go into your InfinityFree `htdocs/` folder.

## Files

| File | Upload To | Purpose |
|------|-----------|---------|
| `index.php` | `htdocs/index.php` | API entry point (PHP 8.1 compatible) |
| `.htaccess` | `htdocs/.htaccess` | URL rewrite + security headers |

## Your htdocs/ Should Look Like

```
htdocs/
├── index.php          <-- Upload this
├── .htaccess          <-- Upload this
├── .env               <-- Create from .env.example (NEVER commit this)
├── app/
├── bootstrap/
├── config/
├── database/
├── routes/
├── storage/           <-- Set permissions to 775
├── vendor/            <-- From composer install
├── composer.json
└── composer.lock
```

## Steps

1. Run `composer install` in `cPanel_YegaraHost/kulu_core/` (on your computer or Termux)
2. Upload all Laravel files to `htdocs/`
3. Upload `index.php` and `.htaccess` from this folder to `htdocs/`
4. Create `.env` file from `.env.example` and fill your credentials
5. Set permissions: `storage/` and `bootstrap/cache/` to 775
6. Import database via phpMyAdmin
7. Upload Firebase service account JSON to `storage/firebase/`
8. Test: https://kulu.xo.je/api/products

## Troubleshooting

| Error | Fix |
|-------|-----|
| `PHP 8.1+ required` | Change PHP version in InfinityFree control panel |
| `vendor/autoload.php not found` | Run `composer install` |
| `.env file not found` | Create `.env` from `.env.example` |
| 500 Error | Check `storage/logs/` for details |
