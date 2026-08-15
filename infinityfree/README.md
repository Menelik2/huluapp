# InfinityFree Deployment Files

These files go into your InfinityFree `htdocs/` folder.

## Files

| File | Upload To | Purpose |
|------|-----------|---------|
| `index.php` | `htdocs/index.php` | API entry point |
| `.htaccess` | `htdocs/.htaccess` | URL rewrite rules |

## Your htdocs/ Should Look Like

```
htdocs/
├── index.php          <-- Upload this
├── .htaccess          <-- Upload this
├── .env               <-- Already configured
├── app/
├── bootstrap/
├── config/
├── database/
├── routes/
├── storage/
├── vendor/            <-- From composer install
├── composer.json
└── composer.lock
```

## Steps

1. Upload all Laravel files to `htdocs/`
2. Upload `index.php` and `.htaccess` from this folder to `htdocs/`
3. Set permissions: `storage/` and `bootstrap/cache/` to 755
4. Import database via phpMyAdmin
5. Upload Firebase service account JSON to `storage/firebase/`
6. Test: https://kulu.xo.je/api/products
