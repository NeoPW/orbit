# work-log Specification

## Purpose

Records the work done on projects as log entries (manually, from habits and from completed tasks), makes logging possible in two taps from Home, and lets the user see and remove a project's entries.

## Requirements

### Requirement: Log work
Home's "Log work" SHALL open a sheet with optional fields for a start time (`HH:mm`, today), a duration in minutes and a note, followed by the active projects, each with its open tasks below it, and then the open tasks outside projects. Clicking one SHALL save a log entry for it with the entered duration and note and source `manual` (for a task also its project or goal), close the sheet and show "Work logged". Without a start time the entry's time SHALL be the current time (the work ended now). With a start time the entry's time SHALL be the start plus the duration (the work ended then), or the start itself when there is no duration. A start time later than the current time SHALL be rejected with an error and nothing saved.

#### Scenario: Two clicks
- **WHEN** the user clicks "Log work" on Home and then the project "Thesis"
- **THEN** a manual log entry for "Thesis" with the current time and no duration exists

#### Scenario: With duration and note
- **WHEN** the user enters 45 minutes and the note "Chapter 2" and clicks "Thesis"
- **THEN** the entry for "Thesis" has a duration of 45 minutes and the note "Chapter 2"

#### Scenario: No start time
- **WHEN** it is 15:00, the user enters 45 minutes without a start time and clicks "Thesis"
- **THEN** the entry's time is 15:00 and the timeline shows it from 14:15 to 15:00

#### Scenario: Start time
- **WHEN** it is 15:00, the user enters a start time of 13:00 and 90 minutes and clicks "Thesis"
- **THEN** the entry's time is 14:30 and the timeline shows it from 13:00 to 14:30

#### Scenario: Start without duration
- **WHEN** the user enters a start time of 13:00 without a duration and clicks "Thesis"
- **THEN** the entry's time is 13:00 and it is shown as a dot at 13:00

#### Scenario: Start in the future
- **WHEN** it is 15:00 and the user enters a start time of 16:00 and clicks "Thesis"
- **THEN** an error is shown and no entry is created

#### Scenario: Nothing to log on
- **WHEN** there is no active project and no open task outside projects
- **THEN** the sheet shows an empty state and creates nothing

#### Scenario: Log on a task
- **WHEN** the user clicks the standalone task "Tax return" in Log work
- **THEN** a manual entry for that task exists and is listed on its task page

#### Scenario: Log on a project's task
- **WHEN** the active project "Thesis" has the open task "Draft intro" and the user enters 30 minutes and clicks "Draft intro" below "Thesis"
- **THEN** a manual 30-minute entry for "Draft intro" and "Thesis" exists and is listed on the task's page and the project's page

#### Scenario: Tasks of inactive projects
- **WHEN** the paused project "Garden" has the open task "Buy seeds"
- **THEN** Log work lists neither "Garden" nor "Buy seeds"

### Requirement: Recently used projects first
Log work SHALL order the active projects, the open tasks of each project, and the open tasks outside projects each on their own: items with log entries first, ordered by their most recent entry (newest first), followed by the rest ordered by title. A project's most recent entry SHALL count the entries of its tasks and habits too.

#### Scenario: Recent first
- **WHEN** project B was logged yesterday, project A last week and project C never
- **THEN** Log work lists B, A, C

#### Scenario: Tasks within a project
- **WHEN** "Thesis" has the open tasks "Draft intro" (logged yesterday), "Add figures" (never logged) and "Check references" (logged last week)
- **THEN** below "Thesis" they are listed "Draft intro", "Check references", "Add figures"

#### Scenario: Task work counts for the project
- **WHEN** project A itself was logged last week and a task of project B was logged yesterday
- **THEN** B is listed before A

### Requirement: Duration validation
A duration SHALL be empty or a whole number of minutes from 1 to 1440. With an invalid duration, no entry SHALL be saved and the field SHALL show an error.

#### Scenario: Invalid duration
- **WHEN** the user enters 0 as duration and taps a project
- **THEN** no entry is saved and the duration field shows an error

### Requirement: Log work from project detail
The project detail's "Log work" action SHALL open a form with the project already chosen, optional duration and note, and a save button. Saving SHALL create a manual log entry for the project with the current time.

#### Scenario: Log from detail
- **WHEN** the user uses "Log work" in a project's detail, enters 30 minutes and saves
- **THEN** a manual 30-minute entry for that project is listed first in its log

### Requirement: Log entry display
Each listed log entry SHALL show its date as `dd-mm-yyyy` and local time as `HH:mm`, its duration if set (for example "45 min" or "1 h 30 min"), its note, and its source (manual, habit, task, timer or workout) as an icon with its name as tooltip.

#### Scenario: Duration format
- **WHEN** a log entry has a duration of 90 minutes
- **THEN** it shows "1 h 30 min"

#### Scenario: Workout source
- **WHEN** a workout log entry is listed
- **THEN** it shows the workout icon with the tooltip "Workout"

### Requirement: Delete log entry
The user SHALL be able to delete a log entry after confirming. Deleting an entry created by a habit check SHALL also remove that habit check. A workout entry SHALL NOT offer delete in the list; it is removed by deleting its session on the phone.

#### Scenario: Delete manual entry
- **WHEN** the user deletes a manual log entry and confirms
- **THEN** the entry is no longer listed

#### Scenario: Delete habit entry
- **WHEN** the user deletes the log entry of today's check of habit "Run" and confirms
- **THEN** "Run" is shown unchecked on Home

#### Scenario: Workout entry
- **WHEN** a workout log entry is listed on a project page
- **THEN** it has no delete button

### Requirement: Total time worked
The total time worked SHALL be shown as the sum of the durations of an item's log entries, in the duration format (see "Log entry display"), or "No time logged" without any: on a task's page for the entries of that task, on a project's page for all entries of the project including those of its tasks and habits, and at the right end of each habit's row in Plan's Habits section for the entries of that habit. It SHALL update live when entries are added or deleted.

#### Scenario: Task total
- **WHEN** the task "Rerun benchmarks" has a 45-minute timer entry and a 30-minute Log work entry
- **THEN** its page shows "1 h 15 min" as time worked

#### Scenario: Project total includes tasks and habits
- **WHEN** the project "Thesis" has a 60-minute entry of its own, a 30-minute entry of its task "Draft intro" and a 20-minute entry of its habit "Read papers"
- **THEN** its page shows "1 h 50 min" as time worked

#### Scenario: Habit total in Plan
- **WHEN** the habit "Run 5 km" has two 40-minute focus sessions and checks without duration
- **THEN** its row in Plan's Habits section shows "1 h 20 min" at its right end

#### Scenario: Nothing logged
- **WHEN** a task has no entries with a duration
- **THEN** its page shows "No time logged"

#### Scenario: Deleted entry
- **WHEN** the 45-minute entry of "Rerun benchmarks" is deleted
- **THEN** its page shows "30 min"

### Requirement: Edit log entry
The entry editor (opened from the day timeline, see day-timeline "Open from a block") SHALL show the entry's start time (`HH:mm`), duration and note, filled in, with Save and Cancel. Saving SHALL change only these values: the entry keeps its day, its source and what it belongs to. Cancel SHALL change nothing. A workout entry SHALL NOT be editable.

#### Scenario: Change the note
- **WHEN** the user opens the entry of "Thesis" with the note "Chapter 2", changes the note to "Chapter 3" and saves
- **THEN** the entry's note is "Chapter 3" and its time, duration and project are unchanged

#### Scenario: Cancel
- **WHEN** the user changes the duration in the editor and cancels
- **THEN** the entry is unchanged

#### Scenario: Habit check keeps its date
- **WHEN** the user edits the entry of yesterday's check of the habit "Run" and saves it with a new start time
- **THEN** "Run" is still checked for yesterday and the entry is still on yesterday's timeline

### Requirement: Edited entry time
Saving the editor SHALL set the entry's time from the start and duration as the timeline reads it: for a timer entry the start; for any other entry the start plus the duration, or the start itself without a duration. The start SHALL be on the entry's day and not later than the current time; a later start SHALL be rejected with an error and nothing saved. The duration SHALL be checked as in "Duration validation".

#### Scenario: Shorter manual entry
- **WHEN** a manual entry is shown from 13:30 to 14:30 and the user changes its duration to 45 minutes
- **THEN** the entry's time is 14:15 and the timeline shows it from 13:30 to 14:15

#### Scenario: Move a timer stretch
- **WHEN** a timer entry runs from 09:00 for 45 minutes and the user changes its start to 08:30
- **THEN** the entry's time is 08:30 and the timeline shows it from 08:30 to 09:15

#### Scenario: Add time to a dot
- **WHEN** the habit check of "Run" is a dot at 07:10 and the user enters 40 minutes and saves
- **THEN** the timeline shows a "Run" block from 07:10 to 07:50

#### Scenario: Start in the future
- **WHEN** it is 15:00 and the user sets the start of today's entry to 16:00
- **THEN** an error is shown and the entry is unchanged

#### Scenario: Invalid duration
- **WHEN** the user enters 0 as the duration and saves
- **THEN** the duration field shows an error and the entry is unchanged

### Requirement: Entry editor actions
The entry editor SHALL offer a link to what the entry belongs to: the task in the task popup, else the project, else the goal (for a habit entry its project, else its goal). An entry without any of them SHALL have no link. The editor SHALL also offer Delete, which works as "Delete log entry" and closes the editor.

#### Scenario: Open the task
- **WHEN** the user opens the editor of an entry of the task "Rerun benchmarks" and uses its link
- **THEN** the popup of "Rerun benchmarks" opens

#### Scenario: Delete from the editor
- **WHEN** the user uses Delete in the editor of today's check entry of the habit "Run" and confirms
- **THEN** the entry is gone from the timeline and "Run" is shown unchecked on Home

#### Scenario: Nothing to link
- **WHEN** an entry belongs to no task, project or goal
- **THEN** its editor has no link
