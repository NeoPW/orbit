# Spec Delta

## MODIFIED Requirements

### Requirement: Complete schema from the start
The database SHALL contain tables for all entities of the product spec: Area, Goal, Measure, MeasureChange, Project, Task, Habit, HabitCheck, LogEntry, Timer, Note, DailyNote, WeeklyReview, ReviewMeasureSnapshot, Exercise, Workout, WorkoutSession, SessionExercise and SessionSet, with the fields defined in `docs/SPEC.md` §4 (including a task's importance and next-step flag, a project's colour, the timer's time limit and session state, the note's target and week, the daily note's date, an exercise's type and distance unit, a workout's ordered exercises and links, a workout session's times, links and log entry, and a set's position and values), and a local-only settings table that is not synced. A project SHALL NOT store a next step of its own.

#### Scenario: Fresh install
- **WHEN** the database is created for the first time
- **THEN** all nineteen entity tables and the settings table exist and the schema version is that of the latest migration

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

#### Scenario: Workout tables added
- **WHEN** the app opens a database at the schema version before this change that contains tasks and habits
- **THEN** the migration adds the exercise and workout tables, both empty, and leaves every existing row unchanged

#### Scenario: Session tables added
- **WHEN** the app opens a database at the schema version before this change that contains exercises and workouts
- **THEN** the migration adds the workout session, session exercise and session set tables, all empty, and leaves every existing row unchanged

#### Scenario: Workout log source
- **WHEN** a log entry with the source `workout` is inserted
- **THEN** it is stored and read back with the source `workout`
