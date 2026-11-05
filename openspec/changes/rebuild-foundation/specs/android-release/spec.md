# Spec Delta

## REMOVED Requirements

### Requirement: Release signed with the release key
**Reason**: The Flutter Android app is removed in the rebuild; there is no APK to sign.
**Migration**: The Android companion app (tasks and time tracking) gets its own capability, including signing, in a later change.

### Requirement: Development builds beside the release
**Reason**: The Flutter Android app is removed in the rebuild.
**Migration**: Covered again by the Android companion app's capability.

### Requirement: App name per build
**Reason**: The Flutter Android app is removed in the rebuild.
**Migration**: Covered again by the Android companion app's capability.

### Requirement: Sync configured in release builds
**Reason**: Supabase sync and the Flutter release script are removed in the rebuild.
**Migration**: Sync returns with the Cloudflare sync server (change `sync-server`); the companion app defines its own release configuration.

### Requirement: Updates in place
**Reason**: The Flutter Android app is removed in the rebuild.
**Migration**: Covered again by the Android companion app's capability.

### Requirement: Reminders in release builds
**Reason**: The Flutter Android app and its notifications are removed in the rebuild.
**Migration**: Notifications are redefined for the desktop app and the Android companion in their own changes.
