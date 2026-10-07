# Spec Delta

## MODIFIED Requirements

### Requirement: Complete schema from the start
The database SHALL contain tables for all entities of the product spec: Area, Objective, KeyResult, Project, Task, Habit, HabitCheck, LogEntry, WeeklyReview, ReviewKrSnapshot and Timer, with the fields defined in `docs/SPEC.md` §4 (including the task's project, KR and objective links, the log entry's task link and the KR's step), including entities that have no UI yet, and a local-only settings table that is not synced.

#### Scenario: Fresh install
- **WHEN** the database is created for the first time
- **THEN** all eleven entity tables and the settings table exist and the schema version is 5

#### Scenario: Unique habit check per day
- **WHEN** a second HabitCheck row is inserted for the same habit and the same date
- **THEN** the insert is rejected

#### Scenario: Unique weekly review per week
- **WHEN** a second WeeklyReview row is inserted for the same `week_start`
- **THEN** the insert is rejected

### Requirement: Schema versioning
The database SHALL record its schema version and SHALL run versioned migrations on upgrade, so later versions can add tables or columns without losing existing data.

#### Scenario: Opening an existing database
- **WHEN** the app opens a database already at the current schema version
- **THEN** no migration runs and all existing data is available

#### Scenario: Upgrade from version 1
- **WHEN** the app opens a database at schema version 1 that contains projects, habits and log entries
- **THEN** it is migrated to the current version, the settings and snapshot tables exist and all existing rows are unchanged

#### Scenario: Upgrade from version 2
- **WHEN** the app opens a database at schema version 2 that contains settings and weekly reviews
- **THEN** it is migrated to the current version, the snapshot table exists and all existing rows are unchanged

#### Scenario: Upgrade from version 3
- **WHEN** the app opens a database at schema version 3 that contains tasks and log entries
- **THEN** it is migrated to the current version, existing tasks keep their project and have no KR or objective, existing log entries have no task, and all other values are unchanged

#### Scenario: Upgrade from version 4
- **WHEN** the app opens a database at schema version 4 that contains numeric key results
- **THEN** it is migrated to version 5, the timer table exists and is empty, every key result has step 1, and all other values are unchanged
