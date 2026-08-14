# Hermes engine configuration (Kulu Android)

Hermes is Facebook’s JS engine optimized for React Native: **faster startup**, **less memory**, **smaller APK** when bytecode is bundled for release.

## Enable (required files)

| File | Setting |
|------|---------|
| `android/gradle.properties` | `hermesEnabled=true` |
| `android/app/proguard-rules.pro` | Keep Hermes + RN + Firebase symbols |
| `metro.config.js` | `inlineRequires: true` for faster cold start |
| `android/app/build.gradle` | Release minify + packaging `pickFirst` for `libhermes.so` |

This repo includes:

- `android/gradle.properties` — **Hermes ON**
- `android/app/proguard-rules.pro`
- `android/app/build.gradle.hermes-snippet` — merge into real `build.gradle`
- `metro.config.js`

## After generating the native project

If you only have app JS sources, generate Android native code once:

```bash
# From a machine with Android SDK
npx @react-native-community/cli init KuluTemp --version 0.75.4
# Copy android/ from the template into KuluMobile_PlayStore/android
# Then copy this repo’s gradle.properties + proguard-rules.pro over the template
```

Or open an existing RN 0.75 app and set:

```properties
hermesEnabled=true
```

## Verify Hermes is running

In a debug build, in a screen temporarily:

```js
console.log('Hermes:', global.HermesInternal != null);
```

Or Dev Menu → “Show Perf Monitor” (Hermes builds report correctly).

Release: check APK contents for `libhermes.so` under `lib/arm64-v8a/`.

## Disable (not recommended)

```properties
hermesEnabled=false
```

Then clean:

```bash
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `libhermes.so` conflict | `packagingOptions { pickFirst "**/libhermes.so" }` |
| Crash after minify | Keep rules in `proguard-rules.pro` |
| Debug works, release fails | Ensure ProGuard keeps NativeModules + Hermes unicode |
| Slow Metro | `inlineRequires: true` already in `metro.config.js` |

## Play Store release

```bash
cd android
./gradlew bundleRelease
# output: app/build/outputs/bundle/release/app-release.aab
```

Hermes compiles JS to bytecode at build time for release — users download less and start faster.
