# Spec Delta

## MODIFIED Requirements

### Requirement: Work blocks
The timeline SHALL plot each log entry of the day that has a duration (a focus session, a workout or tracked time) as a block whose length is its duration. A timer or workout entry SHALL start at its time; an entry of any other source SHALL end at its time (the work was done before it was logged). A block SHALL show what the work was for (for a workout the session's name; otherwise the task, else the habit, else the project, else the goal, else the note) and, as far as its height allows, the project's name and the time range. A block SHALL never be drawn shorter than one line of its title. Its duration and note SHALL show when it is hovered or focused. A running workout session SHALL NOT be shown.

#### Scenario: Timer entry
- **WHEN** a timer entry at 09:00 has a duration of 45 minutes
- **THEN** its block runs from 09:00 to 09:45

#### Scenario: Manual entry
- **WHEN** a manual entry logged at 14:30 has a duration of 60 minutes
- **THEN** its block runs from 13:30 to 14:30

#### Scenario: Label
- **WHEN** a block belongs to the task "Rerun benchmarks" of "Chapter 4: Evaluation" and runs 09:00–10:30
- **THEN** it shows "Rerun benchmarks", "Chapter 4: Evaluation" and "09:00–10:30"

#### Scenario: Habit session
- **WHEN** a focus session on the habit "Run 5 km" of "Training block 3" ran 07:00–07:40
- **THEN** a block labelled "Run 5 km" in the colour of "Training block 3" runs from 07:00 to 07:40

#### Scenario: Workout
- **WHEN** the session "Push day" of project "Strength block" ran 18:05–19:10 and was finished
- **THEN** a block labelled "Push day" in the colour of "Strength block" runs from 18:05 to 19:10

#### Scenario: Short block
- **WHEN** a manual entry of 5 minutes is plotted
- **THEN** its block is at least one line of its title high

#### Scenario: Another day
- **WHEN** an entry was logged yesterday
- **THEN** it is not shown on today's timeline

### Requirement: Open from a block
Clicking a workout block SHALL open the summary of its session (see "Workout summary"). Clicking any other block or dot SHALL open the task it belongs to in the task popup (see tasks, "Task popup"), else (for a habit) its project, else its goal; an entry without any of them is not clickable.

#### Scenario: Open the task
- **WHEN** the user clicks a block of the task "Rerun benchmarks"
- **THEN** the popup of "Rerun benchmarks" opens over the current screen

#### Scenario: Open a workout
- **WHEN** the user clicks the block of the session "Push day"
- **THEN** the summary of "Push day" opens over the current screen

## ADDED Requirements

### Requirement: Workout summary
The summary of a workout session SHALL show, read-only, the session's name, date, time range and length, and each exercise in the session's order with its sets (for endurance with the pace). `Esc`, the close button and a click beside it SHALL close it. It SHALL be the same on the desktop and on the phone.

#### Scenario: Summary content
- **WHEN** the summary of "Push day" (18:05–19:10; Bench press 8 × 60 kg, 8 × 60 kg) is opened
- **THEN** it shows "Push day", the date, "18:05–19:10", "1 h 5 min" and Bench press with its two sets, and nothing in it can be edited

#### Scenario: Deleted session
- **WHEN** a workout entry's session no longer exists
- **THEN** its block is not clickable
