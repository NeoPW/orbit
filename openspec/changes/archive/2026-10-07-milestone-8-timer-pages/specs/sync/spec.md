# Spec Delta

## MODIFIED Requirements

### Requirement: Server copy per user
The server SHALL hold one table per synced entity (areas, objectives, key results, projects, tasks, habits, habit checks, log entries, weekly reviews, review KR snapshots, timers) with the same fields as on the device. Every row SHALL belong to a user, and a user SHALL only be able to read and write their own rows.

#### Scenario: Other user's rows
- **WHEN** a signed-in user queries a table
- **THEN** only rows of that user are returned

#### Scenario: Timer and KR step on the server
- **WHEN** a timer runs and a KR has step 5 on the phone, and the phone syncs
- **THEN** the server holds the timer row and the KR's step 5

### Requirement: One record per natural key
Habit checks (per habit and date), weekly reviews (per week) and the timer (one per account) SHALL get an ID derived from their natural key, so the same check, review or timer created on two devices is one record after sync.

#### Scenario: Habit checked on both devices
- **WHEN** the same habit is checked for the same date on the phone and on the browser before either syncs
- **THEN** after syncing both devices have exactly one check for that habit and date

#### Scenario: Timer started on both devices
- **WHEN** a timer is started on the phone and another on the browser before either syncs
- **THEN** after syncing both devices have exactly one timer, the one started later
