# Tasks

## 1. Signing

- [x] 1.1 `src-tauri/gen/android/app/build.gradle.kts`: add a `release` signingConfig read from `keystore.properties` (keys `storeFile`, `storePassword`, `keyAlias`, `keyPassword`); apply it only when the file exists. Check that `usesCleartextTraffic` is `false` for release and `true` for debug only.
- [x] 1.2 Make sure `*.jks` and `keystore.properties` are ignored by git (`src-tauri/gen/android/.gitignore` and `app/.gitignore`); `git status` stays clean with the files present.
- [x] 1.3 `package.json`: add `android:release` running `sh scripts/android.sh build --apk --target aarch64`.

## 2. Docs

- [x] 2.1 `README.md`: add an "Android release" section: `keytool -genkey` command, keeping the keystore outside the repo with a backup, `keystore.properties` format, `npm run android:release`, the APK path, installing with `adb install` or by copying it to the phone.

## 3. Verify

- [x] 3.1 Create a keystore outside the repo, build with `npm run android:release`, check the signature with `apksigner verify`, install the APK on the phone and connect it to the deployed server (https) and sync.
- [x] 3.2 Move `keystore.properties` away, build again: an unsigned APK is produced. Check the merged release manifest has `usesCleartextTraffic="false"`.
- [x] 3.3 Run `npm run check` once.
