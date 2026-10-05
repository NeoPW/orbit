# account Specification

## Purpose

Connects the app to the user's Supabase project and lets the single user sign in and out with email and password, so their data can be synced between devices.

## Requirements

### Requirement: Connection settings at build time
The app SHALL read the Supabase project URL and publishable key at build time from a local file that is not committed to the repository. When either value is missing, the app SHALL run without sync and the "Account & sync" section SHALL say that sync is not configured in this build.

#### Scenario: Not configured
- **WHEN** the app is built without Supabase values
- **THEN** all features work locally and Settings says that sync is not configured

#### Scenario: Configured
- **WHEN** the app is built with the Supabase URL and key
- **THEN** Settings offers signing in

### Requirement: Sign in with email and password
The "Account & sync" section SHALL let the user sign in with email and password. Wrong credentials or a missing connection SHALL show an error and leave the user signed out. The app SHALL NOT offer creating an account.

#### Scenario: Successful sign-in
- **WHEN** the user enters the email and password of their Supabase user and signs in
- **THEN** the section shows the signed-in email and a first sync starts (see sync)

#### Scenario: Wrong password
- **WHEN** the user signs in with a wrong password
- **THEN** an error is shown and the user stays signed out

#### Scenario: No sign-up
- **WHEN** the user is signed out
- **THEN** there is no option to create an account

### Requirement: Session kept
A signed-in user SHALL stay signed in across app restarts and page reloads until they sign out.

#### Scenario: Restart
- **WHEN** a signed-in user restarts the app or reloads the page
- **THEN** they are still signed in and sync continues

### Requirement: Sign out
The user SHALL be able to sign out. Signing out SHALL stop syncing and keep all local data on the device.

#### Scenario: Sign out
- **WHEN** the user signs out
- **THEN** the section shows the sign-in form, no further sync happens, and all local data is still shown in the app
