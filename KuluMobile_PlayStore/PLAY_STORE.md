# Kulu Android — Google Play

This folder is the **React Native** app for Google Play.

## Who sees what
| Account | UI |
|---------|-----|
| **user** (customer) | Bottom tabs: Shop · Cart · Orders · Support chat |
| **admin** (store owner / seller) | Full admin portal in the same APK |

Role comes from the **Laravel API** after Google sign-in (`ADMIN_EMAIL`).

## Customer (user) screens
- Login (Google)
- Shop grid + product detail
- Cart + place order
- Orders + Chapa pay / verify
- Chat with admin

## Build for Play Store
1. Set `src/config.js` → `API_BASE_URL`, `FIREBASE_WEB_CLIENT_ID`
2. Add `android/app/google-services.json`
3. Create upload keystore; configure `android/app/build.gradle` signing
4. `npm install`
5. `cd android && ./gradlew bundleRelease` → upload `app-release.aab`

## Stack
- React Native 0.75 (React 18)
- Firebase Auth + FCM
- React Navigation (stack + bottom tabs)
- Axios → Laravel Sanctum API

## Target API level
Google Play requires new app submissions to target **Android 16 (API 36)** starting Aug 31, 2026 (extension to Nov 1, 2026 available). `android/build.gradle` is set to `compileSdkVersion 36` / `targetSdkVersion 36` with AGP 8.7.3. Since this repo pins React Native 0.75.4, do a full local `./gradlew bundleRelease` before submitting — RN 0.75's own template historically pinned compileSdk 35, so upgrading to 36 works via the Gradle `ext` values here but hasn't been officially validated by the RN 0.75 release itself. If the build fails against API 36, the safer fallback is upgrading to a newer React Native release (0.77+) that officially supports it, rather than only bumping the SDK numbers.

## Hermes
`android/gradle.properties` has `hermesEnabled=true`. See HERMES.md.

## Payment API paths
- Initialize: `POST /api/payments/chapa/initialize`
- Verify: `GET /api/payments/chapa/verify/{txRef}`

## Signing
See **SIGNING.md** for upload keystore + `bundleRelease`.
