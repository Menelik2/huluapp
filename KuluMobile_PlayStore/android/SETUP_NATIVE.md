# Complete native Android setup

This folder is a **Kulu-configured** Android skeleton (package `com.kulu.mobile`, Hermes, signing hooks).

## Recommended: merge with official RN template

The Gradle Plugin / `node_modules` linkage must match your installed `react-native` version.

```bash
cd /path/to/parent
npx @react-native-community/cli@latest init KuluNative --version 0.75.4 --skip-install

# Copy our app identity + signing into the template
cp -R KuluMobile_PlayStore/android/keystore KuluNative/android/
cp KuluMobile_PlayStore/android/gradle.properties KuluNative/android/
cp KuluMobile_PlayStore/android/app/proguard-rules.pro KuluNative/android/app/
# Merge signing block from app/build.gradle into template app/build.gradle
# Set applicationId "com.kulu.mobile" and namespace

# Point template at our JS:
# Replace KuluNative/App.js etc. OR set project root to KuluMobile_PlayStore
```

Or install deps in **this** project and let RN autolink:

```bash
cd KuluMobile_PlayStore
npm install
# Generate missing wrapper jar if needed:
# cd android && gradle wrapper
npx react-native run-android
```

## Required before first run
1. `npm install` (must include `react-native`, `@react-native/gradle-plugin`)
2. `app/google-services.json` from Firebase
3. `src/config.js` API URL
4. Android SDK 36, NDK, JDK 17

## Release
```bash
bash android/keystore/generate-upload-key.sh
cp android/keystore/key.properties.example android/keystore/key.properties
# edit passwords
cd android && ./gradlew bundleRelease
```
