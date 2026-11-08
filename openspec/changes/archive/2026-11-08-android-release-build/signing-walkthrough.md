# Android release signing: walkthrough

Notes for task 3.1 (install the signed release APK on the phone). Steps to do: 2 → 3 → 4 → 5 → 7.

## 1. Why Android wants a signature

Android installs only signed APKs. The signature doesn't prove trust (no authority checks it; a self-signed key is fine for sideloading). It proves that a new version comes from the same author as the installed one. Android lets an APK replace an installed app only when:

- the application ID is the same (`dev.neopw.orbit`),
- it's signed with the same certificate,
- its version code isn't lower than the installed one.

Debug builds are signed too, with an automatic debug key in `~/.android/debug.keystore`. That key is different from the release key, which matters in step 7.

## 2. Create the key (once)

```
keytool -genkeypair -v -keystore ~/keys/orbit-release.jks \
  -alias orbit -keyalg RSA -keysize 4096 -validity 10000
```

- `keytool` comes with the JDK; Android Studio's copy is `~/android-studio/jbr/bin/keytool`.
- **Keystore** (`orbit-release.jks`): a password-protected file holding the key.
- **Alias** (`orbit`): the key's name inside the keystore.
- **Key pair**: a private key that signs and stays secret, and a certificate (with the public key) that is copied into every APK.
- `-validity 10000`: about 27 years. Keep it long; the app can't move to a new certificate without key rotation (step 9).
- **Prompts** (name, organisation, ...): only shown in the certificate; anything works.
- **Passwords**: PKCS12 keystores (the default) use one password for store and key, so enter the same one twice.

## 3. Tell Gradle where the key is

Create `src-tauri/gen/android/keystore.properties` and `chmod 600` it (passwords in plain text; ignored by git, as are `*.jks` and `*.keystore`):

```
storeFile=/home/kldell54304/keys/orbit-release.jks
storePassword=...
keyAlias=orbit
keyPassword=...
```

`app/build.gradle.kts` loads the file if it exists, creates a `release` signing config when it has a `storeFile`, and uses it for the release build type. Without the file the release APK comes out unsigned.

## 4. Build

`npm run android:release` (`tauri android build --apk --target aarch64`):

1. builds the frontend (Vite → `dist/`),
2. compiles the Rust core for `arm64-v8a`,
3. Gradle packages it, shrinks it with R8 and signs it.

Output: `src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk` (`-unsigned` suffix when no key is configured).

## 5. Check it

```
~/Android/Sdk/build-tools/<ver>/apksigner verify --print-certs <apk>
keytool -list -v -keystore ~/keys/orbit-release.jks
```

The SHA-256 fingerprints must match. Write it down: it is the app's identity.

## 6. Install

- Copy the APK to the phone and open it (allow installs from that app; a Play Protect "unknown developer" warning is normal), or
- `adb install -r <apk>` with USB debugging on.

## 7. The debug build already on the phone

Debug and release share the application ID but have different keys, so the release APK can't install over the debug app (signature conflict). Uninstalling the debug app deletes its local database, so:

1. sync the phone with the server,
2. uninstall the debug app,
3. install the release APK,
4. connect it to `https://orbit.<subdomain>.workers.dev` with a device token,
5. sync; the data comes back.

From then on only release builds on the phone; debug builds on the emulator.

## 8. Updates

Bump `version` in `package.json` (Tauri derives the Android version code from it, roughly major·1,000,000 + minor·1,000 + patch), rebuild with the same key, install over the existing app. Data is kept.

## 9. Back up the key

Losing the keystore or its password means no more updates: uninstall (losing local data) and reinstall under a new key. Keep a copy of the `.jks` off this machine (encrypted backup or USB stick) and the password in a password manager. Key rotation (APK Signature Scheme v3) exists but needs the old key, so it doesn't replace a backup.
