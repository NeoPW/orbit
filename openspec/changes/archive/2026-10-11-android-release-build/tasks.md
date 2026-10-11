# Tasks

## 1. Build identities and signing

- [x] 1.1 In `android/app/build.gradle.kts`, give `debug` the `applicationIdSuffix ".debug"` and `profile` the suffix `".profile"`, and set `resValue("string", "app_name", …)` to "Orbit" for release and "Orbit Dev" for debug and profile. In `android/app/src/main/AndroidManifest.xml`, set `android:label="@string/app_name"`. Verify: `flutter build apk --debug` succeeds, and `aapt2 dump badging` (or `apkanalyzer`) on the debug APK shows the package `dev.neopw.orbit.debug` and the label "Orbit Dev".
- [x] 1.2 In `android/app/build.gradle.kts`, load `android/key.properties` when it exists and add a `release` signing config from it. Remove the fallback to the debug key, and fail `preReleaseBuild` with "android/key.properties not found, see README" when the file is missing. Verify: without `key.properties`, `flutter build apk --release` fails with that message, and `flutter build apk --debug` still succeeds.
- [x] 1.3 Add `android/app/src/main/res/raw/keep.xml`, which keeps `@mipmap/ic_launcher`. Verify: `aapt2 dump resources` on the release APK built in 2.2 still lists `mipmap/ic_launcher` with its PNGs (release builds shorten resource paths, so `unzip -l` shows no `ic_launcher` file names).

## 2. Release key and build script

- [x] 2.1 (User, manual) Create the keystore outside the repo with `keytool -genkeypair -v -keystore ~/.config/orbit/release.jks -keyalg RSA -keysize 4096 -validity 10000 -alias orbit`, write `android/key.properties` and back up both. Verify: `git status` does not list `key.properties` or the keystore.
- [x] 2.2 Add `tool/build_release.sh` (executable). It checks `android/key.properties` and `supabase.json`, builds `flutter build apk --release --dart-define-from-file=supabase.json`, and checks the signature with `apksigner` (found under `$ANDROID_HOME`, or `~/Android/Sdk`, `build-tools/<newest>`), failing on `CN=Android Debug`. It prints the version, build number and APK path, and supports `--install` (`adb install -r`, from `platform-tools`). Verify: without `supabase.json`, the script stops before building. With both files present, it prints the version and path, and `apksigner verify --print-certs` shows the release certificate.
- [x] 2.3 Document in `README.md` (new section "Release build on Android"): creating and backing up the key, `key.properties`, bumping the build number in `pubspec.yaml`, `tool/build_release.sh [--install]`, and the one-time migration from design.md. Add the release command to the commands tables in `README.md` and `CLAUDE.md`. Verify: the README commands match the script's options.
- [x] 2.4 Add a line to `docs/SPEC.md` §2 that Android is distributed as a signed APK, installed by hand, with development builds kept apart. Verify: the line is in the diff.

## 3. Verification

- [x] 3.1 Run `flutter analyze` (no warnings) and the full `flutter test -r failures-only` once. Neither should change, since no Dart code changes.
- [x] 3.2 On the phone, follow the migration from design.md (sync, uninstall the current app, `tool/build_release.sh --install`, sign in). Verify: the launcher shows "Orbit", the account's data arrives, a habit reminder and the running-timer notification show with the app icon, and tapping a reminder opens its screen.
- [x] 3.3 Run `flutter run` on the same phone. Verify: "Orbit Dev" installs next to "Orbit", and the release app still opens with its data. Bump the build number, run the release script again with `--install`, and verify that Orbit updates in place and keeps its data and sign-in.
- [x] 3.4 Run `flutter run -d chrome --dart-define-from-file=supabase.json`. Verify: the web app starts and syncs as before (the change is Android-only).
