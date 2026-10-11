# Spec Delta

## Purpose

Defines how the installable Android app is built: a signed release that is installed by hand and updated in place, kept apart from development builds on the same phone.

## ADDED Requirements

### Requirement: Release signed with the release key
A release build SHALL be signed with the project's release key. The keystore and its passwords SHALL NOT be stored in the repository. A release build SHALL NOT be signed with the Android debug key.

#### Scenario: Signed release
- **WHEN** a release APK is built with the release key configured
- **THEN** the APK's signing certificate is the release key's, not the Android debug certificate

#### Scenario: Key not configured
- **WHEN** a release build is started without the release key configured
- **THEN** the build fails with a message naming the missing key configuration, and no APK is produced

### Requirement: Development builds beside the release
Debug and profile builds SHALL use an application ID different from the release build's, so that they install next to the release app on the same phone without replacing it or its data.

#### Scenario: Run during development
- **WHEN** a debug build is installed on a phone that has the release app
- **THEN** both apps are installed, and the release app keeps its local data

### Requirement: App name per build
The release app SHALL be named "Orbit" on the phone. Debug and profile builds SHALL show the name "Orbit Dev".

#### Scenario: Launcher names
- **WHEN** the release app and a debug build are both installed
- **THEN** the launcher shows "Orbit" for the release app and "Orbit Dev" for the debug build

### Requirement: Sync configured in release builds
The release build script SHALL build with the sync configuration (§7) and SHALL refuse to build when that configuration is missing.

#### Scenario: Configuration missing
- **WHEN** the release build script runs without `supabase.json`
- **THEN** it stops with a message before building

#### Scenario: Sync available
- **WHEN** the release app is opened on the phone
- **THEN** signing in under Account & sync is offered and syncing with the account works

### Requirement: Updates in place
A newer release APK with a higher build number SHALL install over the installed release app and keep its local data. The release build script SHALL print the version and build number of the APK it built.

#### Scenario: Install an update
- **WHEN** a release APK with a higher build number is installed over the installed release app
- **THEN** the app is updated and its local data, sign-in and reminders remain

### Requirement: Reminders in release builds
Scheduled reminders and the running-timer notification SHALL show in the release app with the app's notification icon, as they do in debug builds.

#### Scenario: Habit reminder in release
- **WHEN** a habit reminder is due in the release app
- **THEN** the notification is shown with the app's icon
