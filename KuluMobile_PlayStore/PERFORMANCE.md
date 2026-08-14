# React Native Android performance (Kulu)

## App code (already applied)
- Memoized `ProductCard` for shop grid
- FlatList tuning: `initialNumToRender`, `maxToRenderPerBatch`, `windowSize`, `removeClippedSubviews`
- Stable `keyExtractor` / `renderItem` via `useCallback`
- Chat message rows memoized; skip state update when last message unchanged
- FCM registration deferred with `InteractionManager.runAfterInteractions`
- Images: `fadeDuration={0}` on Android list thumbnails
- API timeout 15s

## Android release build (enable on your machine)

In `android/gradle.properties`:
```
hermesEnabled=true
newArchEnabled=false
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
org.gradle.parallel=true
```

In `android/app/build.gradle` release block:
```
minifyEnabled true
shrinkResources true
proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
```

Hermes is default on RN 0.75 — keep it on for smaller JS and faster startup.

## Images
Prefer server-side resized product images (e.g. max 800px width, WebP) so list decode stays cheap.

## Profiling
```
npx react-native start
# Dev menu → Toggle Performance Monitor
# or: npx react-native profile-hermes
```


## Hermes
Configured in `android/gradle.properties` (`hermesEnabled=true`). See **HERMES.md**.
