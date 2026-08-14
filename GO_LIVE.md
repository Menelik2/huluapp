# Kulu go-live checklist (production)

Use this in order. Tick each item before Play production release.

---

## A. Domain & hosting

- [ ] API subdomain ready, e.g. `https://api.yourdomain.com` (HTTPS certificate active)
- [ ] Optional web shop: `https://shop.yourdomain.com` or `/shop` static host
- [ ] cPanel layout:
  ```
  /home/USER/kulu_core/     ← Laravel (not public)
  /home/USER/public_html/   ← or subdomain docroot → public_html files
  ```

---

## B. Database

- [ ] MySQL database + user created
- [ ] Import `database_sql/kulu_database_full.sql` **or** `php artisan migrate`
- [ ] If upgrading from seller-role schema:
  ```sql
  UPDATE users SET role = 'user' WHERE role = 'seller';
  ```
- [ ] Confirm tables: users, products, categories, orders, order_items, payments, messages, personal_access_tokens

---

## C. Laravel `.env` (production)

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.yourdomain.com
APP_KEY=base64:...          # php artisan key:generate

DB_DATABASE=...
DB_USERNAME=...
DB_PASSWORD=...

ADMIN_EMAIL=your.google@gmail.com
ADMIN_EMAILS=

FIREBASE_CREDENTIALS=/home/USER/kulu_core/storage/firebase/service-account.json

CHAPA_SECRET_KEY=CHASECK_LIVE-...   # live keys for production
CHAPA_PUBLIC_KEY=CHAPUBK_LIVE-...

BROADCAST_CONNECTION=pusher         # or null if skipping realtime
PUSHER_APP_ID=...
PUSHER_APP_KEY=...
PUSHER_APP_SECRET=...
PUSHER_APP_CLUSTER=mt1

FILESYSTEM_DISK=public
```

- [ ] Firebase service account JSON uploaded; path matches `FIREBASE_CREDENTIALS`
- [ ] `composer install --no-dev --optimize-autoloader`
- [ ] `php artisan storage:link`
- [ ] `php artisan config:cache && php artisan route:cache`
- [ ] File permissions: `storage/` and `bootstrap/cache/` writable

---

## D. API smoke tests

```bash
# Public catalog
curl -s https://api.yourdomain.com/api/products | head

# Categories
curl -s https://api.yourdomain.com/api/categories | head
```

With a real Firebase ID token:

```bash
curl -s -X POST https://api.yourdomain.com/api/auth/google \
  -H 'Content-Type: application/json' \
  -d '{"id_token":"FIREBASE_ID_TOKEN"}'
```

- [ ] Login returns `token` + `user.role` (`admin` only for ADMIN_EMAIL)
- [ ] `GET /api/admin/overview` with Bearer token → 200 for admin, 403 for customer
- [ ] Chapa webhook URL registered in Chapa dashboard:
  `https://api.yourdomain.com/api/payments/chapa/webhook`

---

## E. Firebase

- [ ] Android app package `com.kulu.mobile` registered
- [ ] Google Sign-In enabled; SHA-1/SHA-256 added (debug + **release upload key**)
- [ ] `google-services.json` → `KuluMobile_PlayStore/android/app/`
- [ ] Web client ID → `src/config.js` → `FIREBASE_WEB_CLIENT_ID`
- [ ] Cloud Messaging API enabled (FCM)

Get release SHA-1:

```bash
keytool -list -v -keystore android/keystore/kulu-upload.jks -alias kulu-upload
```

---

## F. Mobile app

- [ ] `src/config.js`:
  ```js
  export const API_BASE_URL = 'https://api.yourdomain.com/api';
  export const FIREBASE_WEB_CLIENT_ID = '....apps.googleusercontent.com';
  ```
- [ ] `npm install`
- [ ] Upload keystore + `key.properties` (SIGNING.md)
- [ ] `cd android && ./gradlew bundleRelease`
- [ ] Install test build on device: customer flow + admin flow

---

## G. Play Console

- [ ] App created, package `com.kulu.mobile`
- [ ] Store listing (STORE_LISTING.md): icon, feature graphic, screenshots, descriptions
- [ ] Privacy policy URL live (see `privacy/index.html`)
- [ ] Data safety form filled
- [ ] Content rating completed
- [ ] Production AAB uploaded (or internal testing track first)

---

## H. Roles (final)

| Google account | Role | Sees |
|----------------|------|------|
| Matches `ADMIN_EMAIL` | admin | Admin portal (store owner) |
| Any other | user | Shop / Cart / Orders / Chat |

---

## I. Optional

- [ ] Pusher for realtime chat (else polling + FCM)
- [ ] Web admin at `web/admin/` for desktop
- [ ] Server monitoring / daily DB backup in cPanel


## J. Backups & Chapa webhook test

```bash
# Daily backup (on server)
export KULU_CORE=$HOME/kulu_core
export BACKUP_DIR=$HOME/backups/kulu
bash $KULU_CORE/scripts/backup_kulu.sh

# Webhook smoke test
export API_BASE=https://api.yourdomain.com/api
export TX_REF=your-tx-ref-from-chapa
bash cPanel_YegaraHost/scripts/test_chapa_webhook.sh
```

See `cPanel_YegaraHost/scripts/`.
Amharic Play listing: `KuluMobile_PlayStore/STORE_LISTING_AM.md`.

### Healthcheck
```bash
export API_BASE=https://api.yourdomain.com/api
bash cPanel_YegaraHost/scripts/healthcheck_api.sh
```

### Restore backup
```bash
bash cPanel_YegaraHost/scripts/restore_kulu.sh $HOME/backups/kulu/kulu_YYYYMMDD_HHMMSS.tar.gz
```
