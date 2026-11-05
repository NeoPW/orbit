# Spec Delta

## MODIFIED Requirements

### Requirement: Warning when browser storage is unavailable
In the browser, the app SHALL ask the browser to keep its storage persistent. If the browser offers no storage for the database, the app SHALL still start, on an in-memory database, and SHALL show a persistent warning that data will be lost when the page is closed.

#### Scenario: No persistent storage
- **WHEN** the app is opened in a browser window that offers no storage for the database (for example a private window in Firefox)
- **THEN** the app starts with an in-memory database and shows a warning that data is not saved

#### Scenario: Storage available
- **WHEN** the app is opened in a normal Chrome or Firefox window
- **THEN** no storage warning is shown and saved data survives a reload

### Requirement: Complete schema from the start
The database SHALL contain tables for all entities of the product spec: Area, Goal, Measure, Project, Task, Habit, HabitCheck, LogEntry, Timer, Note, WeeklyReview and ReviewMeasureSnapshot, with the fields defined in `docs/SPEC.md` §4 (including a task's importance and next-step flag, the timer's planned length and the note's target and week), and a local-only settings table that is not synced. A project SHALL NOT store a next step of its own.

#### Scenario: Fresh install
- **WHEN** the database is created for the first time
- **THEN** all twelve entity tables and the settings table exist and the schema version is 1

#### Scenario: Unique habit check per day
- **WHEN** a second HabitCheck row is inserted for the same habit and the same date
- **THEN** the insert is rejected

#### Scenario: Unique weekly review per week
- **WHEN** a second WeeklyReview row is inserted for the same `week_start`
- **THEN** the insert is rejected

#### Scenario: Unique note per target and week
- **WHEN** a second Note row is inserted for the same target type, target and `week_start`
- **THEN** the insert is rejected

### Requirement: Record identity and timestamps
Every record SHALL have a client-generated UUID `id`, a `created_at` and `updated_at` timestamp in UTC, and a nullable `deleted_at`. The `id` SHALL be a random UUID v4, except for habit checks, weekly reviews and notes, whose `id` SHALL be a UUID v5 derived from their natural key (habit and date; week start; target type, target and week start), and the timer, which has one fixed `id`. Creating a record SHALL set `created_at` and `updated_at` to the current time; every update SHALL set `updated_at` to the current time.

#### Scenario: Create sets identity and timestamps
- **WHEN** a record is created
- **THEN** it has a new UUID v4 `id`, `created_at` equals `updated_at`, both are UTC, and `deleted_at` is empty

#### Scenario: Update bumps updated_at
- **WHEN** an existing record is updated
- **THEN** its `updated_at` is later than before and its `created_at` is unchanged

#### Scenario: Deterministic habit check ID
- **WHEN** the same habit is checked for the same date on two devices
- **THEN** both checks get the same `id`

#### Scenario: Deterministic note ID
- **WHEN** the note of the same project for the week starting 2026-11-02 is created on two devices
- **THEN** both notes get the same `id`, and a note of the same project for another week gets a different one

#### Scenario: Fixed timer ID
- **WHEN** a timer is started on two devices
- **THEN** both timer records have the same `id`

### Requirement: Enumerations stored as text
Enumerated values (goal status, project status, task status, measure type, schedule type, log source, note target type) SHALL be stored as the text values defined in `docs/SPEC.md` §4 (for example `times_per_week`, `backlog`, `goal`).

#### Scenario: Stored status value
- **WHEN** a project with status backlog is saved
- **THEN** its stored status column contains the text `backlog`

## ADDED Requirements

### Requirement: Data persists on the desktop and in the browser
All data SHALL be stored locally and SHALL survive a restart of the desktop app and a page reload in the browser. No network connection SHALL be required.

#### Scenario: Restart of the desktop app
- **WHEN** data is saved in the desktop app and the app is closed and started again
- **THEN** the data is still there

#### Scenario: Reload in the browser
- **WHEN** data is saved in the browser and the page is reloaded
- **THEN** the data is still there

#### Scenario: Offline use
- **WHEN** the computer has no network connection
- **THEN** data is saved and read as normal

### Requirement: Schema version and migrations
The database SHALL record its schema version and SHALL run versioned, forward-only migrations when the app starts, so later versions can add tables or columns without losing existing data. Each migration SHALL be applied completely or not at all.

#### Scenario: Opening an existing database
- **WHEN** the app opens a database already at the current schema version
- **THEN** no migration runs and all existing data is available

#### Scenario: Upgrade to a newer version
- **WHEN** the app opens a database at an older schema version that contains data
- **THEN** each newer migration runs once, in order, the schema version becomes the current one, and the existing rows are unchanged

#### Scenario: Failing migration
- **WHEN** a migration fails halfway
- **THEN** none of its changes remain, the schema version stays at the previous one, and the app shows that the database could not be opened instead of starting with a partial schema

### Requirement: Database location
On the desktop, the database SHALL be one SQLite file, `orbit.db`, in the app data directory of the running app identity, so that development runs and the installed release use separate databases. In the browser, the database SHALL belong to the site's origin, so each address the app is served from has its own data.

#### Scenario: Development run beside the release
- **WHEN** a development run saves data on a computer where the release app is installed
- **THEN** the data is written to `orbit.db` in the development identity's data directory, and the release app's `orbit.db` is unchanged

#### Scenario: Different addresses in the browser
- **WHEN** the browser build is opened from two different addresses
- **THEN** each address has its own database

### Requirement: One browser tab at a time
In the browser, only one tab SHALL have the database open. A further tab of the same site SHALL NOT open it and SHALL show that Orbit is already open in another tab; after the first tab is closed, reloading the further tab SHALL open the database.

#### Scenario: Second tab
- **WHEN** Orbit is open in one tab and the same address is opened in a second tab
- **THEN** the second tab shows that Orbit is open in another tab and changes no data

#### Scenario: First tab closed
- **WHEN** the first tab is closed and the second tab is reloaded
- **THEN** the second tab opens the database and shows the saved data

### Requirement: Writes that belong together
Several writes that belong together (for example completing a task and creating its log entry) SHALL be applicable as one unit: either all of them are stored or none.

#### Scenario: One write of a unit fails
- **WHEN** a unit of two inserts is applied and the second insert is rejected
- **THEN** the first insert is not stored either

## REMOVED Requirements

### Requirement: Move objectives and key results to goals and measures
**Reason**: The rebuild starts with an empty database at schema version 1; there is no Flutter-era data to move.
**Migration**: None. The old data stays in the Flutter app (tag `flutter-final`) and its Supabase project.

### Requirement: Data persists locally
**Reason**: Its scenarios name Android and Flutter web, which the rebuild no longer has.
**Migration**: Replaced by "Data persists on the desktop and in the browser".

### Requirement: Schema versioning
**Reason**: Its upgrade scenarios cover the Flutter schema versions 1–7, which no longer exist; the rebuild starts again at version 1.
**Migration**: Replaced by "Schema version and migrations".
