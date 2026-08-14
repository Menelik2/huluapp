# Play Store signing configuration (Kulu)

Google Play requires a **signed** Android App Bundle (`.aab`).  
Modern apps use **Play App Signing**: you hold an **upload key**; Google holds the **app signing key**.

## 1. Create the upload keystore

```bash
cd KuluMobile_PlayStore
bash android/keystore/generate-upload-key.sh
```

Or manually:

```bash
keytool -genkeypair -v \
  -storetype JKS \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -keystore android/keystore/kulu-upload.jks \
  -alias kulu-upload \
  -dname "CN=Kulu Mobile, OU=Mobile, O=Kulu, L=Addis Ababa, ST=Addis Ababa, C=ET"
```

**Back up** `kulu-upload.jks` and passwords offline. Losing them complicates updates.

## 2. key.properties (local secrets)

```bash
cp android/keystore/key.properties.example android/keystore/key.properties
```

Edit:

```properties
storePassword=********
keyPassword=********
keyAlias=kulu-upload
storeFile=../keystore/kulu-upload.jks
```

Paths in `key.properties` are relative to the **android/** project root (resolved via
`rootProject.file(...)` in `build.gradle`), so:

```properties
storeFile=keystore/kulu-upload.jks
```

## 3. Wire Gradle

Already done — `android/app/build.gradle` in this repo already loads `keystore/key.properties`
and defines `signingConfigs.release` + `buildTypes.release { signingConfig ...; minifyEnabled true; ... }`.
You don't need to merge `build.gradle.signing-snippet`; it's kept only as reference documentation.
Just create `key.properties` (step 2) and build — Gradle picks it up automatically.

Also keep Hermes + ProGuard from `HERMES.md` / `proguard-rules.pro` (already wired too).

## 4. Build the Play bundle

```bash
cd android
./gradlew bundleRelease
```

Output:

```
android/app/build/outputs/bundle/release/app-release.aab
```

Upload that `.aab` in Play Console → Production (or Testing).

## 5. Play Console — App signing

1. Create app: **Kulu Online Shopping** (`com.kulu.mobile` or your `applicationId`)
2. First upload: Play enables **Play App Signing** by default
3. You continue signing with the **upload key** (`kulu-upload.jks`) for every release
4. Optional: upload the **upload key certificate** if Console asks

Export certificate (if needed):

```bash
keytool -export -rfc \
  -keystore android/keystore/kulu-upload.jks \
  -alias kulu-upload \
  -file android/keystore/upload_certificate.pem
```

## 6. versionCode / versionName

Bump on every Play upload in `android/app/build.gradle`:

```gradle
versionCode 2        // integer, must increase every release
versionName "1.0.1"  // user-visible
```

## 7. Security checklist

| Do | Don't |
|----|--------|
| Keep `.jks` offline + encrypted backup | Commit `.jks` or `key.properties` to git |
| Use different passwords for store/key if you want | Share upload key with random devices |
| Use Play App Signing | Rely on debug keystore for production |

## 8. Debug vs release

| Build | Key |
|-------|-----|
| `run-android` / debug | Android debug keystore (automatic) |
| `bundleRelease` / Play | `kulu-upload.jks` via `key.properties` |

## Troubleshooting

| Error | Fix |
|-------|-----|
| `key.properties not found` | Create file under `android/keystore/` |
| `Wrong password` | Match keytool passwords exactly |
| `storeFile not found` | `storeFile=keystore/kulu-upload.jks` from android root |
| Play rejects signing | Same upload key as first release; or reset upload key via Play support |
| `Minify crash` | Check `proguard-rules.pro` (Hermes + Firebase keeps) |
