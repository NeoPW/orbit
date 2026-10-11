# Proposal

## Why

The app on the phone is a development build. Its release build type is signed with the shared Android debug key (`android/app/build.gradle.kts`), so it has no stable identity of its own, and every `flutter run` can replace it. Orbit is meant to be the daily tracker on the phone (docs/SPEC.md §1, §2), so it needs a real, signed release that is installed once, updated in place and kept apart from development builds.

## What Changes

- Release builds are signed with a personal release key. The keystore and its passwords live outside the repository, referenced from a git-ignored `android/key.properties`. A release build never falls back to the debug key: without the key it fails with a clear message.
- Debug and profile builds get their own application ID suffix and app name ("Orbit Dev"), so they install next to the release app instead of replacing it. **BREAKING** (for the phone only): the current install shares the release ID but carries the debug signature. It has to be synced and uninstalled once before the first release install.
- The release app is named "Orbit" (currently "orbit").
- A script `tool/build_release.sh` builds the signed release APK with the sync configuration (`supabase.json`, §7), checks that it is not debug-signed, prints its version and path, and optionally installs it over USB with `adb`.
- Release builds keep the notification icon through resource shrinking, so reminders (§8) work in release as they do in debug.
- README documents creating and backing up the key, bumping the version, building, installing and the one-time move from the current install.

Out of scope:
- Google Play Store or any other store distribution (App Bundle, listing, Play App Signing).
- Automatic updates, update checks and CI builds.
- Showing the app version in Settings.
- iOS and native desktop builds (§9 "Later").
- Changes to the web build or its hosting.

## Capabilities

### New Capabilities
- `android-release`: how the installable Android app is built and identified: release signing, separate identities for development and release builds, the app name, the sync configuration in release builds and versioned in-place updates.

### Modified Capabilities
<!-- none: app behavior inside the app is unchanged -->

## Impact

- `android/app/build.gradle.kts`: release signing config from `key.properties`, ID suffixes and app names per build type.
- `android/app/src/main/AndroidManifest.xml`: app label from the build type.
- `android/app/src/main/res/raw/keep.xml` (new): keeps the notification icon.
- `tool/build_release.sh` (new), `README.md`, `CLAUDE.md` (commands).
- `docs/SPEC.md` §2 needs a line on the signed, sideloaded Android release.
- No Dart code, database or `supabase/schema.sql` changes, and no new packages.
- One-time manual step on the phone: sync, uninstall the current install, install the release and sign in again.
