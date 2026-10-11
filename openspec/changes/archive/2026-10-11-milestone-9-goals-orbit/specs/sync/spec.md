# Spec Delta

## ADDED Requirements

### Requirement: Server tables per user
The server SHALL hold one table per synced entity (areas, goals, measures, projects, tasks, habits, habit checks, log entries, weekly reviews, review measure snapshots, timers) with the same fields as on the device. Every row SHALL belong to a user, and a user SHALL only be able to read and write their own rows.

#### Scenario: Other user's rows
- **WHEN** a signed-in user queries a table
- **THEN** only rows of that user are returned

#### Scenario: Goal color and measure step on the server
- **WHEN** a goal has the color rose and a measure has step 5 on the phone, and the phone syncs
- **THEN** the server holds the goal's color and the measure's step 5

### Requirement: Server migration
The server schema script SHALL be safe to run more than once. Run on a server that still has objectives and key results, it SHALL move their data to goals and measures exactly as the device does (same IDs, timestamps and deletion state), without changing any record's `updated_at`, so devices that upgraded locally and the server hold the same records.

#### Scenario: Run on an old server
- **WHEN** the script runs on a server with objectives, key results and projects linked to key results
- **THEN** the server has the same goals, measures and project goal links as an upgraded device

#### Scenario: Run twice
- **WHEN** the script runs a second time
- **THEN** nothing changes and no data is lost

#### Scenario: Upgraded device syncs afterwards
- **WHEN** an upgraded phone syncs with the migrated server
- **THEN** no goal, measure or project changes on either side because of the move

### Requirement: Sync across the upgrade
A device that has upgraded locally SHALL keep its changes until the server is migrated: while the server lacks the new tables, uploads SHALL fail silently and be retried, and nothing SHALL be lost. A device on an older app version SHALL stop syncing once the server is migrated, keeping its local data.

#### Scenario: Server not migrated yet
- **WHEN** the phone runs the new version, the server still has objectives, and the user creates a goal
- **THEN** the goal stays on the phone and is uploaded at the first sync after the server is migrated

#### Scenario: Old version after migration
- **WHEN** the web app still runs the old version after the server was migrated
- **THEN** its sync fails silently and its local data is kept

## REMOVED Requirements

### Requirement: Server copy per user
**Reason**: The server holds goals and measures instead of objectives and key results.
**Migration**: See "Server tables per user" above.
