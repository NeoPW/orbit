# sync Specification

## Purpose

Keeps the local data of every signed-in device in step with the user's server copy: local-first, last-write-wins per record, with deletes propagating and each user only able to see their own data.

## Requirements

### Requirement: Server copy per user
The server SHALL hold one table per synced entity (areas, objectives, key results, projects, tasks, habits, habit checks, log entries, weekly reviews, review KR snapshots) with the same fields as on the device. Every row SHALL belong to a user, and a user SHALL only be able to read and write their own rows.

#### Scenario: Other user's rows
- **WHEN** a signed-in user queries a table
- **THEN** only rows of that user are returned

### Requirement: Local-first
The app SHALL keep working entirely from the local database. Sync SHALL run in the background, and no screen SHALL wait for the network.

#### Scenario: Offline edit
- **WHEN** the user is signed in, offline, and creates a project
- **THEN** the project is saved and shown immediately and is uploaded at the next successful sync

### Requirement: Push and pull
A sync SHALL first upload every local record changed since the last successful upload, then download every server record changed since the last successful download and apply it locally when the local copy is missing or older (by `updated_at`). Soft-deleted records SHALL be synced like any other change. Local settings SHALL NOT be synced.

#### Scenario: Change on the other device
- **WHEN** a project is renamed on the phone and both devices sync
- **THEN** the browser shows the new name

#### Scenario: Delete propagates
- **WHEN** a task is deleted on the browser and both devices sync
- **THEN** the task is gone on the phone

#### Scenario: Settings stay local
- **WHEN** the lead time is changed on the phone and both devices sync
- **THEN** the browser keeps its own lead time

### Requirement: Last write wins
When the same record was changed on two devices, the version with the later `updated_at` SHALL win on the server and on every device. An older version SHALL never overwrite a newer one.

#### Scenario: Concurrent edits
- **WHEN** a project's title is changed offline on the phone at 10:00 and on the browser at 10:05, and the phone syncs after the browser
- **THEN** both devices end up with the browser's title

### Requirement: One record per natural key
Habit checks (per habit and date) and weekly reviews (per week) SHALL get an ID derived from their natural key, so the same check or review created on two devices is one record after sync.

#### Scenario: Habit checked on both devices
- **WHEN** the same habit is checked for the same date on the phone and on the browser before either syncs
- **THEN** after syncing both devices have exactly one check for that habit and date

### Requirement: First sign-in on a device
At the first sign-in on a device, if the account has no data on the server, the device SHALL upload all its local data. If the account already has data, the app SHALL ask for confirmation and then replace the device's local data with the account's data. Without confirmation the user SHALL be signed out again and the local data left unchanged.

#### Scenario: Empty account
- **WHEN** the user signs in on the phone and the account has no data
- **THEN** all of the phone's data is uploaded

#### Scenario: Account with data
- **WHEN** the user then signs in on the browser, which has its own local data, and confirms
- **THEN** the browser's local data is replaced by the account's data and nothing from the browser is uploaded

#### Scenario: Not confirmed
- **WHEN** the user cancels the confirmation
- **THEN** they are signed out and the browser's local data is unchanged

### Requirement: When sync runs
While signed in, a sync SHALL run when the app starts, when it returns to the foreground, a few seconds after local changes, when the user pulls to refresh on Home, Plan or Review, and when the user taps "Sync now" in Settings. Only one sync SHALL run at a time.

#### Scenario: After a change
- **WHEN** the user checks a habit while signed in and online
- **THEN** the check is uploaded within a few seconds without further action

#### Scenario: Pull to refresh
- **WHEN** the user pulls down on Home
- **THEN** a sync runs and the refresh indicator ends when it finishes

### Requirement: Failures and status
A failed sync SHALL NOT interrupt the user with errors; it SHALL be retried at the next trigger. The "Account & sync" section SHALL show the time of the last successful sync (`dd-mm-yyyy HH:mm`) and, after a failed attempt, that the last sync failed. Nothing SHALL be lost by a failed sync.

#### Scenario: Offline sync
- **WHEN** a sync runs without network
- **THEN** no error dialog appears, Settings shows that the last sync failed, and the changes are uploaded at the next successful sync

#### Scenario: Last synced
- **WHEN** a sync succeeds at 14:05 on 2026-10-05
- **THEN** Settings shows "Last synced 05-10-2026 14:05"
