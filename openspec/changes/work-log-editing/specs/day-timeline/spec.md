## MODIFIED Requirements

### Requirement: Open from a block
Clicking a workout block SHALL open the summary of its session (see "Workout summary"). Clicking any other block or dot SHALL open the editor of its log entry (see work-log, "Edit log entry"). A block made of several logged timer stretches (see "Resumed stretches as one block") SHALL first list them with their time range and minutes; choosing one SHALL open its editor. A running stretch is not yet an entry: it SHALL NOT be listed, and a running block without logged stretches SHALL open the task popup of its task, else its project, else its goal.

#### Scenario: Open the entry
- **WHEN** the user clicks a block of the task "Rerun benchmarks"
- **THEN** the editor of that entry opens over the current screen

#### Scenario: Open a dot
- **WHEN** the user clicks the dot of the habit check "Run 5 km"
- **THEN** the editor of that check's entry opens

#### Scenario: Entry without a target
- **WHEN** the user clicks a block of an entry that belongs to no task, project or goal
- **THEN** the editor of that entry opens

#### Scenario: Open a workout
- **WHEN** the user clicks the block of the session "Push day"
- **THEN** the summary of "Push day" opens over the current screen

#### Scenario: Merged block
- **WHEN** "Thesis" has timer stretches 10:00–10:30 and 10:35–11:00 drawn as one block and the user clicks it
- **THEN** "10:00–10:30, 30 min" and "10:35–11:00, 25 min" are listed, and choosing the second opens its editor

#### Scenario: Open the task
- **WHEN** a session for the task "Rerun benchmarks" runs since 09:00 without earlier stretches and the user clicks its block
- **THEN** the popup of "Rerun benchmarks" opens

### Requirement: Today screen on the phone
The phone's Today screen SHALL show the timeline of one day, starting with today, with the day's weekday and date as a heading, a "previous day" and a "next day" button, and a horizontal swipe to move between days: swiping right shows the previous day, swiping left the next one. The next day SHALL NOT go beyond today. The now line SHALL show only on today. All other timeline behaviour (blocks, dots, colours, running session, opening a block) SHALL be the same as on the desktop.

#### Scenario: Open Today
- **WHEN** the user opens Today on the phone
- **THEN** the timeline of today with its date is shown, including a running session as a running block

#### Scenario: Previous day by button
- **WHEN** the user taps "previous day" while Thursday the 12th is shown
- **THEN** the timeline of Wednesday the 11th is shown, without a now line

#### Scenario: Swipe to the previous day
- **WHEN** the user swipes right on the timeline of today
- **THEN** the timeline of yesterday is shown

#### Scenario: Not beyond today
- **WHEN** today is shown and the user swipes left or looks for "next day"
- **THEN** today stays shown and "next day" is disabled

#### Scenario: Open a block
- **WHEN** the user taps a block of the task "Rerun benchmarks" on the phone
- **THEN** the editor of that entry opens full screen
