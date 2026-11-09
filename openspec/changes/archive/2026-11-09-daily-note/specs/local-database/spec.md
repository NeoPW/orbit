# Spec Delta

## MODIFIED Requirements

### Requirement: Complete schema from the start
The database SHALL contain tables for all entities of the product spec: Area, Goal, Measure, MeasureChange, Project, Task, Habit, HabitCheck, LogEntry, Timer, Note, DailyNote, WeeklyReview and ReviewMeasureSnapshot, with the fields defined in `docs/SPEC.md` §4 (including a task's importance and next-step flag, a project's colour, the timer's time limit and session state, the note's target and week, and the daily note's date), and a local-only settings table that is not synced. A project SHALL NOT store a next step of its own.

#### Scenario: Fresh install
- **WHEN** the database is created for the first time
- **THEN** all fourteen entity tables and the settings table exist and the schema version is that of the latest migration

#### Scenario: Unique habit check per day
- **WHEN** a second HabitCheck row is inserted for the same habit and the same date
- **THEN** the insert is rejected

#### Scenario: Unique weekly review per week
- **WHEN** a second WeeklyReview row is inserted for the same `week_start`
- **THEN** the insert is rejected

#### Scenario: Unique note per target and week
- **WHEN** a second Note row is inserted for the same target type, target and `week_start`
- **THEN** the insert is rejected

#### Scenario: Colour column added to projects
- **WHEN** the app opens a database at schema version 1 that contains projects
- **THEN** the migration adds the project colour, leaves every existing project row unchanged, and the colour of those projects is empty

#### Scenario: Unique daily note per day
- **WHEN** a second DailyNote row is inserted for the same date
- **THEN** the insert is rejected

### Requirement: Record identity and timestamps
Every record SHALL have a client-generated UUID `id`, a `created_at` and `updated_at` timestamp in UTC, and a nullable `deleted_at`. The `id` SHALL be a random UUID v4, except for habit checks, weekly reviews, notes and daily notes, whose `id` SHALL be a UUID v5 derived from their natural key (habit and date; week start; target type, target and week start; date), and the timer, which has one fixed `id`. Creating a record SHALL set `created_at` and `updated_at` to the current time; every update SHALL set `updated_at` to the current time.

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

#### Scenario: Deterministic daily note ID
- **WHEN** the daily note of 2026-11-09 is created on two devices
- **THEN** both notes get the same `id`, and the note of 2026-11-10 gets a different one

#### Scenario: Fixed timer ID
- **WHEN** a timer is started on two devices
- **THEN** both timer records have the same `id`
