# Proposal

## Why

The Android app only builds as a debug APK (`npm run android:build`). The release build type has no signing config, so Gradle produces an unsigned APK that Android will not install. To use Orbit daily on the phone, against the deployed https sync server, it needs a signed release build (SPEC §9 item 6, Android companion, is done in debug form only).

## What Changes

- Release signing config in `src-tauri/gen/android/app/build.gradle.kts`, read from an untracked `keystore.properties` (already in the Android `.gitignore`); the release build still works without it, unsigned, so a fresh checkout and the debug build are not affected.
- `npm run android:release` builds a signed release APK for `aarch64` (`scripts/android.sh build --apk --target aarch64`).
- README: how to create the keystore with `keytool`, where to keep it (outside the repo, backed up; losing it means no updates over the installed app), the `keystore.properties` format, and how to install the APK.
- Cleartext traffic stays debug-only (already so in `build.gradle.kts`); the release APK talks only to https servers.

Assumption: sideloading only; one keystore for this one app; `aarch64` phones only (the emulator uses the debug build).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-platforms`: "Installable Android app" also covers a signed release APK.

## Impact

- `src-tauri/gen/android/app/build.gradle.kts`, `package.json`, `README.md`.
- Related: SPEC §9 item 6. No SPEC change needed.
- Out of scope: Play Store and app bundle (.aab), in-app update check, CI builds, versioning automation, Windows/macOS.
