# See also **GO_LIVE.md** for the full production checklist.

# KuluApp Deployment Guide

## 1. cPanel / Yegara layout

```
/home/USERNAME/kulu_core/          # Laravel app (outside web root)
/home/USERNAME/public_html/        # API document root
```

1. Upload `cPanel_YegaraHost/kulu_core` contents to `kulu_core`.
2. Upload `cPanel_YegaraHost/public_html/*` into the API domain/subdomain document root.
3. Edit `public_html/index.php` if the relative path to `kulu_core` differs.
4. Create MySQL database + user in cPanel; put credentials in `kulu_core/.env`.
5. Place Firebase service-account JSON at the path set in `FIREBASE_CREDENTIALS`.
6. Set `ADMIN_EMAIL` to the Google account that should be admin.
7. Run:

```bash
cd ~/kulu_core
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate
# OR import database_sql/kulu_database_full.sql via phpMyAdmin
php artisan storage:link
php artisan config:cache
php artisan route:cache
```

## 2. Firebase

- Create Android app with your package name.
- Enable Google Sign-In.
- Download `google-services.json` → `KuluMobile_PlayStore/android/app/google-services.json`
- Set Web Client ID in `src/config.js`
- Service account for Laravel only (never in the mobile app)

## 3. Mobile

```bash
cd KuluMobile_PlayStore
# edit src/config.js
npm install
npx react-native run-android
# release AAB:
cd android && ./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

## 4. Release signing

Generate and protect your own keystore. Never commit keystore or passwords.

## 5. Post-deploy checks

- HTTPS only
- `POST /api/auth/google` with a real Firebase ID token
- Non-admin cannot call `/api/admin/*` (403)
- Order create decrements stock; cancel restores stock
- Chat messages for another user's thread are not readable by a random customer


## 6. Server FCM push

1. In Firebase Console → Project settings → Cloud Messaging, ensure the API is enabled.
2. The same service-account JSON used for Auth (`FIREBASE_CREDENTIALS`) is used to send pushes.
3. Mobile calls `POST /api/device/fcm` after login with the device token.
4. Triggers:
   - New order → all admins with an FCM token
   - Order status change → the customer
   - Chat message → the receiver
5. Invalid/unregistered tokens are cleared automatically on the user row.


## 7. Real-time chat (Laravel Echo + Pusher)

1. Create a Pusher Channels app (or run Soketi/Reverb).
2. Set in `kulu_core/.env`:
   ```
   BROADCAST_CONNECTION=pusher
   PUSHER_APP_ID=...
   PUSHER_APP_KEY=...
   PUSHER_APP_SECRET=...
   PUSHER_APP_CLUSTER=mt1
   ```
3. `composer require pusher/pusher-php-server` (already in composer.json)
4. Web `config.js` → same `PUSHER.key` + `cluster`
5. Channel: `private-chat.{lowUserId}.{highUserId}`
6. Event name: `message.sent`
7. Auth endpoint: `POST /api/broadcasting/auth` (Sanctum Bearer token)

If Pusher is not configured, chat falls back to polling / FCM push.
