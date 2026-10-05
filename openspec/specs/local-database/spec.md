# local-database Specification

## Purpose

Stores all app data locally on the device (native SQLite on Android, browser storage on web) so the app works fully offline, using a schema that is ready for later features and for sync.

## Requirements

### Requirement: Data persists locally
All data SHALL be stored locally and SHALL survive an app restart on Android and a page reload on web. No network connection SHALL be required.

#### Scenario: Restart on Android
- **WHEN** the user creates a project and then fully closes and reopens the app on Android
- **THEN** the project is still shown

#### Scenario: Reload in the browser
- **WHEN** the user creates a project in Chrome and reloads the page
- **THEN** the project is still shown

#### Scenario: Offline use
- **WHEN** the device has no network connection
- **THEN** all create, edit and delete actions work as normal

### Requirement: Warning when browser storage is unavailable
On web, if the browser offers no persistent storage for the database, the app SHALL still start and SHALL show a persistent warning that data will be lost when the page is closed.

#### Scenario: No persistent storage
- **WHEN** the app is opened in a browser where persistent database storage is unavailable
- **THEN** the app starts with an in-memory database and shows a warning banner that data is not saved

### Requirement: Complete schema from the start
The database SHALL contain tables for all entities of the product spec: Area, Objective, KeyResult, Project, Task, Habit, HabitCheck, LogEntry and WeeklyReview, with the fields defined in `docs/SPEC.md` §4, including entities that have no UI yet, and a local-only settings table that is not synced.

#### Scenario: Fresh install
- **WHEN** the database is created for the first time
- **THEN** all nine entity tables and the settings table exist and the schema version is 2

#### Scenario: Unique habit check per day
- **WHEN** a second HabitCheck row is inserted for the same habit and the same date
- **THEN** the insert is rejected

#### Scenario: Unique weekly review per week
- **WHEN** a second WeeklyReview row is inserted for the same `week_start`
- **THEN** the insert is rejected

### Requirement: Record identity and timestamps
Every record SHALL have a client-generated UUID v4 `id`, a `created_at` and `updated_at` timestamp in UTC, and a nullable `deleted_at`. Creating a record SHALL set `created_at` and `updated_at` to the current time; every update SHALL set `updated_at` to the current time.

#### Scenario: Create sets identity and timestamps
- **WHEN** a record is created
- **THEN** it has a new UUID v4 `id`, `created_at` equals `updated_at`, both are UTC, and `deleted_at` is empty

#### Scenario: Update bumps updated_at
- **WHEN** an existing record is updated
- **THEN** its `updated_at` is later than before and its `created_at` is unchanged

### Requirement: Soft delete
Deleting a record SHALL set its `deleted_at` (and `updated_at`) instead of removing the row. Soft-deleted records SHALL be excluded from all lists, lookups and counts shown in the app.

#### Scenario: Delete hides record
- **WHEN** the user deletes an area
- **THEN** the area row still exists with `deleted_at` set, and the area no longer appears anywhere in the app

### Requirement: Enumerations stored as text
Enumerated values (objective status, project status, task status, measure type, schedule type, log source) SHALL be stored as the text values defined in `docs/SPEC.md` §4 (for example `times_per_week`, `backlog`).

#### Scenario: Stored status value
- **WHEN** a project with status backlog is saved
- **THEN** its stored status column contains the text `backlog`

### Requirement: Calendar dates are time-zone independent
Calendar dates (objective start/end, deadlines, due dates, habit check dates, week starts) SHALL be stored as dates without a time of day, so they read back as the same date regardless of the device's time zone. Times of day (habit reminder time) SHALL be stored as local `HH:mm`.

#### Scenario: Deadline round trip
- **WHEN** a project deadline of 2026-12-31 is saved and later read on a device in a different time zone
- **THEN** the deadline is still 2026-12-31

### Requirement: Schema versioning
The database SHALL record its schema version and SHALL run versioned migrations on upgrade, so later versions can add tables or columns without losing existing data.

#### Scenario: Opening an existing database
- **WHEN** the app opens a database already at the current schema version
- **THEN** no migration runs and all existing data is available

#### Scenario: Upgrade from version 1
- **WHEN** the app opens a database at schema version 1 that contains projects, habits and log entries
- **THEN** it is migrated to version 2, the settings table exists and all existing rows are unchanged

### Requirement: Default areas on first launch
When the database is created for the first time, the app SHALL create the areas Job, Personal, Sport and Uni. Seeding SHALL NOT run again on later launches, even if the user has edited or deleted those areas.

#### Scenario: First launch
- **WHEN** the app starts with a new, empty database
- **THEN** the areas Job, Personal, Sport and Uni exist, in that order

#### Scenario: Deleted default area stays deleted
- **WHEN** the user deletes the area Uni and restarts the app
- **THEN** Uni does not reappear
