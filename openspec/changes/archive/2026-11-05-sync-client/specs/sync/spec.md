# Spec Delta

## ADDED Requirements

### Requirement: First connection of a device
At the first connection of a device, if the server holds no data, the device SHALL upload all its local data. If the server holds data, the app SHALL ask for confirmation and then replace all of the device's synced data with the server's. Without confirmation the device SHALL stay unconnected and its local data SHALL be left unchanged.

#### Scenario: Empty server
- **WHEN** the desktop app with local data connects to a server that holds no data
- **THEN** all of the desktop's records, deleted ones included, are uploaded

#### Scenario: Server with data
- **WHEN** the browser, which has its own local data, connects to a server that holds data, and the user confirms
- **THEN** the browser's synced data is replaced by the server's, nothing from the browser is uploaded, and its local settings are kept

#### Scenario: Not confirmed
- **WHEN** the user cancels the confirmation
- **THEN** the device is not connected and its local data is unchanged

### Requirement: Interrupted upload continues
Uploads SHALL be sent in parts the server accepts. When a sync stops part-way, the parts already stored SHALL NOT be uploaded again, and the next sync SHALL continue with the rest.

#### Scenario: Large first upload
- **WHEN** a device with 1200 changed records syncs
- **THEN** all 1200 are stored on the server

#### Scenario: Connection lost during upload
- **WHEN** the connection drops after the first part of an upload was stored
- **THEN** the next sync uploads only the records that were not stored yet

### Requirement: Changes during a sync
A local change made while a sync is running SHALL be uploaded, at the latest by the next sync.

#### Scenario: Edit while syncing
- **WHEN** a project is renamed while a sync is downloading
- **THEN** the new name is on the server after the next sync

### Requirement: Sync triggers
While connected, a sync SHALL run when the app starts, when it returns to the foreground, a few seconds after a local change to synced data, every 5 minutes while the app is open, and when the user chooses "Sync now". Only one sync SHALL run at a time; a trigger during a running sync SHALL lead to one more sync after it.

#### Scenario: After a change
- **WHEN** the user changes a synced record while connected and online
- **THEN** the change is uploaded within a few seconds without further action

#### Scenario: Several changes in a row
- **WHEN** the user makes five changes within two seconds
- **THEN** one sync uploads all five

#### Scenario: Back to the foreground
- **WHEN** the app returns to the foreground after another device changed a record
- **THEN** a sync runs and the change is downloaded

#### Scenario: App left open
- **WHEN** the app stays open in the background for 5 minutes
- **THEN** a sync has run

#### Scenario: Local settings do not trigger a sync
- **WHEN** only a local setting changes
- **THEN** no sync is started because of it

#### Scenario: Sync now during a sync
- **WHEN** the user chooses "Sync now" while a sync is running
- **THEN** the running sync finishes and exactly one more sync runs after it

### Requirement: Same schema version as the server
A device SHALL sync only with a server that has the same schema version. While the versions differ, every sync SHALL fail silently with the reason "different schema version", local changes SHALL be kept, and syncing SHALL resume by itself once both have the same version.

#### Scenario: App newer than the server
- **WHEN** the desktop app has a newer schema version than the server and the user creates a goal
- **THEN** the goal stays on the desktop, the last sync shows as failed, and the goal is uploaded at the first sync after the server was updated

#### Scenario: App older than the server
- **WHEN** the browser still runs an older version after the server was updated
- **THEN** its sync fails silently and its local data is kept

## MODIFIED Requirements

### Requirement: Local-first
The app SHALL keep working entirely from the local database. Sync SHALL run in the background, and no screen SHALL wait for the network.

#### Scenario: Offline edit
- **WHEN** the device is connected, offline, and the user creates a project
- **THEN** the project is saved and shown immediately and is uploaded at the next successful sync

### Requirement: Failures and status
A failed sync SHALL NOT interrupt the user with errors; it SHALL be retried at the next trigger. The app SHALL show the time of the last successful sync (`dd-mm-yyyy HH:mm`) and, after a failed attempt, that the last sync failed, with the reason: no connection, token refused, a different schema version, or a server error. Nothing SHALL be lost by a failed sync.

#### Scenario: Offline sync
- **WHEN** a sync runs without network
- **THEN** no error dialog appears, the app shows that the last sync failed because there was no connection, and the changes are uploaded at the next successful sync

#### Scenario: Last synced
- **WHEN** a sync succeeds at 14:05 on 2026-10-05
- **THEN** the app shows "Last synced 05-10-2026 14:05"

#### Scenario: Token removed on the server
- **WHEN** the device's token is removed from the server and a sync runs
- **THEN** the app shows that the last sync failed because the token was refused, and the local data is kept

## REMOVED Requirements

### Requirement: First sign-in on a device
**Reason**: There is no sign-in; devices connect with a token. Replaced by "First connection of a device".
**Migration**: None.

### Requirement: When sync runs
**Reason**: Replaced by "Sync triggers": a 5-minute interval is added, and pull-to-refresh moves to the Home, Plan and Review changes, which do not exist yet.
**Migration**: None.

### Requirement: Sync across the upgrade
**Reason**: It described the move from objectives to goals on the old server. Replaced by "Same schema version as the server".
**Migration**: None.
