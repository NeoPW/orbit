# Spec Delta

## ADDED Requirements

### Requirement: Move objectives and key results to goals and measures
Upgrading a database from schema version 6 SHALL move its data to goals and measures, keeping every record's ID, timestamps and deletion state, as defined in `docs/SPEC.md` §4 "Moving from objectives and key results". Nothing SHALL have to be entered again.

#### Scenario: Objective becomes a goal
- **WHEN** a version 6 database has the active objective "Get job" with color `#FF7A9C`
- **THEN** after the upgrade the goal "Get job" exists with the same ID, dates, status, order and color

#### Scenario: Key result becomes a measure
- **WHEN** the objective "Get job" has the numeric key result "Kann" at 4 of 5 with step 1 and deadline 2026-10-16
- **THEN** after the upgrade "Get job" has the measure "Kann" with the same ID, 4 of 5 and step 1, and no deadline

#### Scenario: Project linked to a key result
- **WHEN** the project "Create app" is linked to the key result "Kann" of "Get job"
- **THEN** after the upgrade "Create app" serves the goal "Get job"

#### Scenario: Tasks, habits and log entries
- **WHEN** a task is assigned to "Kann", another to the objective "Get job", a habit and a log entry are linked to "Kann"
- **THEN** after the upgrade both tasks are assigned to "Get job", and the habit and the log entry are linked to "Get job"

#### Scenario: Review snapshots
- **WHEN** a completed review stored a snapshot of "Kann" at 60 %
- **THEN** after the upgrade the review has a measure snapshot of "Kann" at 60 %

#### Scenario: Completed project
- **WHEN** a completed project was last updated on 2026-10-05
- **THEN** after the upgrade its completion time is that update time

#### Scenario: Deleted key result
- **WHEN** a key result was soft-deleted before the upgrade
- **THEN** its measure exists and is soft-deleted too

## MODIFIED Requirements

### Requirement: Complete schema from the start
The database SHALL contain tables for all entities of the product spec: Area, Goal, Measure, Project, Task, Habit, HabitCheck, LogEntry, WeeklyReview, ReviewMeasureSnapshot and Timer, with the fields defined in `docs/SPEC.md` §4 (including the goal links of projects, tasks, habits and log entries, the project's completion time, the goal's color and the measure's step), and a local-only settings table that is not synced.

#### Scenario: Fresh install
- **WHEN** the database is created for the first time
- **THEN** all eleven entity tables and the settings table exist and the schema version is 7

#### Scenario: Unique habit check per day
- **WHEN** a second HabitCheck row is inserted for the same habit and the same date
- **THEN** the insert is rejected

#### Scenario: Unique weekly review per week
- **WHEN** a second WeeklyReview row is inserted for the same `week_start`
- **THEN** the insert is rejected

### Requirement: Enumerations stored as text
Enumerated values (goal status, project status, task status, measure type, schedule type, log source) SHALL be stored as the text values defined in `docs/SPEC.md` §4 (for example `times_per_week`, `backlog`).

#### Scenario: Stored status value
- **WHEN** a project with status backlog is saved
- **THEN** its stored status column contains the text `backlog`

### Requirement: Calendar dates are time-zone independent
Calendar dates (goal start/end, deadlines, due dates, habit check dates, week starts) SHALL be stored as dates without a time of day, so they read back as the same date regardless of the device's time zone. Times of day (habit reminder time) SHALL be stored as local `HH:mm`.

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
- **THEN** it is migrated to the current version, the settings and snapshot tables exist and all existing rows are unchanged

#### Scenario: Upgrade from version 2
- **WHEN** the app opens a database at schema version 2 that contains settings and weekly reviews
- **THEN** it is migrated to the current version, the snapshot table exists and all existing rows are unchanged

#### Scenario: Upgrade from version 3
- **WHEN** the app opens a database at schema version 3 that contains tasks and log entries
- **THEN** it is migrated to the current version, existing tasks keep their project and have no goal, existing log entries have no task, and all other values are unchanged

#### Scenario: Upgrade from version 4
- **WHEN** the app opens a database at schema version 4 that contains numeric key results
- **THEN** it is migrated to the current version, the timer table exists and is empty, and every resulting measure has step 1

#### Scenario: Upgrade from version 5
- **WHEN** the app opens a database at schema version 5 that contains objectives
- **THEN** it is migrated to the current version and the resulting goals have no own color

#### Scenario: Upgrade from version 6
- **WHEN** the app opens a database at schema version 6 with objectives, key results and linked projects
- **THEN** it is migrated to version 7 as described in "Move objectives and key results to goals and measures"
