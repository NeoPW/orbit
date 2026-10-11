# Design

## Context

- `android/app/build.gradle.kts` signs `release` with `signingConfigs.getByName("debug")` (Flutter template). Debug, profile and release all use `dev.neopw.orbit`.
- `android/.gitignore` already ignores `key.properties`, `*.jks` and `*.keystore`.
- The manifest label is a hard-coded `orbit`. `INTERNET` is already declared in the main manifest, so sync works in release.
- Notifications are initialized with the icon `@mipmap/ic_launcher` by name (`lib/core/notifications/local_notification_scheduler.dart`). flutter_local_notifications 22.x needs no own ProGuard rules (Gson ships them since v19), but its README asks to keep icons referenced by name from resource shrinking.
- The phone currently runs a build with ID `dev.neopw.orbit` that is signed with the debug key. Android refuses to update it with a differently signed APK.

## Goals / Non-Goals

**Goals:** a reproducible, one-command signed release APK. Development keeps working unchanged with `flutter run`.

**Non-Goals:** store distribution, CI, splitting APKs per ABI, obfuscation (`--obfuscate`).

## Decisions

1. **Signing from `android/key.properties`.** It holds `storeFile` (an absolute path outside the repo, e.g. `~/.config/orbit/release.jks`), `storePassword`, `keyAlias` and `keyPassword`. Gradle loads it when present and creates a `release` signing config. If the file is missing, `release` gets no signing config. A check that runs before the release tasks (`preReleaseBuild`) then fails with "android/key.properties not found, see README". Debug builds don't run this check.
   - *Alternative:* environment variables. Rejected because they are easy to forget and leak into the shell history. The properties file is the Flutter-documented way and is already git-ignored.
   - *Alternative:* keep the fallback to the debug key. Rejected: it produces an APK that can't update the real install, the problem this change removes.

2. **Build-type identities.** `debug` gets `applicationIdSuffix = ".debug"` and `profile` gets `".profile"`. The app name comes from `resValue("string", "app_name", …)` per build type ("Orbit" for release, "Orbit Dev" for the others), and the manifest uses `@string/app_name`. This needs `buildFeatures { resValues = true }`, which is off by default in the current Android Gradle plugin. Plugins that register receivers by class name (flutter_local_notifications) are unaffected by the ID suffix.

3. **Build script `tool/build_release.sh`.** It checks `android/key.properties` and `supabase.json` and stops with a message if either is missing. It then runs `flutter build apk --release --dart-define-from-file=supabase.json` and checks the signature with `apksigner verify --print-certs` (from the Android SDK build-tools), failing on `CN=Android Debug`. Finally it prints the version and build number from `pubspec.yaml` and the APK path. With `--install`, it runs `adb install -r` on the built APK.
   - The script builds one universal APK (all ABIs). It is larger than per-ABI APKs, but one file fits any phone and keeps `versionCode` equal to the pubspec build number.

4. **Versioning stays manual in `pubspec.yaml`** (`version: x.y.z+N`). Bump `N` for every release; Android rejects a lower `versionCode` than the installed one. The script prints the version but does not bump it, so the version change is a visible commit.

5. **Keep the notification icon.** Add `res/raw/keep.xml` with `tools:keep="@mipmap/ic_launcher"`. This costs nothing and guards against shrinking removing an icon that is only referenced by name.

No new packages, and no database or schema changes.

## Risks / Trade-offs

- [Lost keystore means the app can't be updated: uninstall, reinstall and re-sync] → README: back the keystore and passwords up outside the machine (e.g. in a password manager). Sync limits the damage to unsynced local data.
- [The first release install needs the current install removed, which loses unsynced data] → Migration steps below: sync first and check the last sync time in Settings.
- [R8 in release strips something that a plugin needs by reflection] → Verify on the phone: sync, reminders, timer notification and opening a reminder. Add keep rules only if something breaks.
- [Debug and release on the phone have separate local data] → Intended. Both sync through the same account.

## Migration Plan

One time, on the phone:
1. In the current app: Settings → Account & sync → Sync now, and check the last sync time.
2. Uninstall the current app (`adb uninstall dev.neopw.orbit`).
3. `tool/build_release.sh --install`.
4. Open Orbit, sign in, confirm that the account's data replaces the empty local data, and allow notifications.

Rollback: uninstall the release and run `flutter run` as before. The data is in the account.
