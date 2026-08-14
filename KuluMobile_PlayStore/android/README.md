# Android native project

## Secrets (do not commit)
- `app/google-services.json` — Firebase
- `keystore/kulu-upload.jks` — Play upload key
- `keystore/key.properties` — keystore passwords

## Hermes
`gradle.properties` → `hermesEnabled=true`  
See `../HERMES.md`

## Signing (Play Store)
This project's `app/build.gradle` already reads `keystore/key.properties` and wires the release
signing config automatically — no manual merge needed. You only need to:
1. `bash keystore/generate-upload-key.sh`
2. Copy `keystore/key.properties.example` → `key.properties` and fill in the real passwords
3. `./gradlew bundleRelease`

(`app/build.gradle.signing-snippet` is kept only as reference documentation — it's already applied.)

Full guide: `../SIGNING.md`
