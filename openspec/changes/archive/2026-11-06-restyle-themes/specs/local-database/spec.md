# Spec Delta

## MODIFIED Requirements

### Requirement: Complete schema from the start
The database SHALL contain tables for all entities of the product spec: Area, Goal, Measure, Project, Task, Habit, HabitCheck, LogEntry, Timer, Note, WeeklyReview and ReviewMeasureSnapshot, with the fields defined in `docs/SPEC.md` §4 (including a task's importance and next-step flag, a project's colour, the timer's planned length and the note's target and week), and a local-only settings table that is not synced. A project SHALL NOT store a next step of its own.

#### Scenario: Fresh install
- **WHEN** the database is created for the first time
- **THEN** all twelve entity tables and the settings table exist and the schema version is 2

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
