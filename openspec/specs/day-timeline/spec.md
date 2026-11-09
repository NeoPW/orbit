# day-timeline Specification

## Purpose
Shows the work of a day as blocks on an hour axis, coloured by project, so the day (on Home) and each day of a week (in the review) can be read at a glance. It is a view of work already done, not a planner.

## Requirements

### Requirement: Work blocks
The timeline SHALL plot each log entry of the day that has a duration (a focus session or tracked time) as a block whose length is its duration. A timer entry SHALL start at its time; an entry of any other source SHALL end at its time (the work was done before it was logged). A block SHALL show what the work was for (the task, else the habit, else the project, else the goal, else the note) and, as far as its height allows, the project's name and the time range. A block SHALL never be drawn shorter than one line of its title. Its duration and note SHALL show when it is hovered or focused.

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

#### Scenario: Short block
- **WHEN** a manual entry of 5 minutes is plotted
- **THEN** its block is at least one line of its title high

#### Scenario: Another day
- **WHEN** an entry was logged yesterday
- **THEN** it is not shown on today's timeline

### Requirement: Block colours
A block SHALL be coloured like the project it belongs to (see visual-design, "Project colour coding"): a task's block takes its project's colour, a block that belongs to a goal only takes the goal's colour, and a block without project or goal is neutral. The label SHALL always accompany the colour.

#### Scenario: Project colour
- **WHEN** an entry belongs to the project "Portfolio site"
- **THEN** its block has the colour of "Portfolio site"

#### Scenario: Task of a project
- **WHEN** an entry belongs to a task of "Chapter 4: Evaluation"
- **THEN** its block has the colour of "Chapter 4: Evaluation"

#### Scenario: No project
- **WHEN** an entry belongs to a standalone task
- **THEN** its block is neutral

### Requirement: Entries without duration
A log entry without a duration (a completed task, a habit check, work logged without time) SHALL be shown as a small dot at its time, in its colour, without text, at the left edge of the day's column so that it does not cover a block. Its label, time and note SHALL show when it is hovered or focused.

#### Scenario: Task completed
- **WHEN** the task "Email supervisor" of "Chapter 4: Evaluation" was completed at 11:20 without logged time
- **THEN** a dot in the colour of "Chapter 4: Evaluation" is shown at 11:20, without text

#### Scenario: Habit checked
- **WHEN** the habit "Run 5 km" of "Training block 3" is checked at 07:10
- **THEN** a dot in the colour of "Training block 3" is shown at 07:10

#### Scenario: Dot details
- **WHEN** the user hovers the dot of "Email supervisor"
- **THEN** "Email supervisor" and "11:20" are shown

### Requirement: Overlapping blocks
Blocks that overlap in time SHALL be placed side by side, each narrower, so that none hides another.

#### Scenario: Two at once
- **WHEN** one block runs from 10:00 to 11:00 and another from 10:30 to 11:30
- **THEN** both are visible side by side during 10:30–11:00

### Requirement: Running session
A running focus session SHALL be drawn as a block from its start to the current time, marked as running (for example with a striped fill), growing with time. It SHALL become a normal block when the session is paused or completed and its stretch is logged; a paused session SHALL have no running block.

#### Scenario: Running
- **WHEN** a focus session for "Rerun benchmarks" started at 09:00 and it is 09:20
- **THEN** its block runs from 09:00 to 09:20, marked as running

#### Scenario: Paused
- **WHEN** that session is paused at 09:20
- **THEN** a normal block runs from 09:00 to 09:20 and no running block is drawn

### Requirement: Visible hours
The day's axis SHALL show the hours 06:00 to 22:00 and SHALL extend to whole hours earlier or later when work lies outside them. On today's timeline a line SHALL mark the current time.

#### Scenario: Default range
- **WHEN** all work of the day lies between 09:00 and 17:00
- **THEN** the axis runs from 06:00 to 22:00

#### Scenario: Early work
- **WHEN** an entry starts at 05:10
- **THEN** the axis starts at 05:00

#### Scenario: Now line
- **WHEN** it is 15:40 and the timeline of today is shown
- **THEN** a line marks 15:40

### Requirement: Empty day
A day without work SHALL show the axis and a short empty state instead of blocks.

#### Scenario: Nothing logged
- **WHEN** no work was logged today
- **THEN** the timeline shows the axis and a short empty state

### Requirement: Open from a block
Clicking a block or dot SHALL open the task it belongs to in the task popup (see tasks, "Task popup"), else (for a habit) its project, else its goal; an entry without any of them is not clickable.

#### Scenario: Open the task
- **WHEN** the user clicks a block of the task "Rerun benchmarks"
- **THEN** the popup of "Rerun benchmarks" opens over the current screen

### Requirement: Timeline updates live
The timeline SHALL update immediately after work is logged, a session starts or stops, or the data changes through sync, and SHALL move to the next day when the date changes.

#### Scenario: Log work
- **WHEN** the user logs 30 minutes on a project
- **THEN** its block appears on the timeline without a reload

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
- **THEN** the task popup opens full screen

### Requirement: Resumed stretches as one block
Timer blocks of the same task, habit or project SHALL be drawn as one block when at most 10 minutes lie between the end of one and the start of the next, also across several pauses and including the running stretch. The block SHALL run from the first start to the last end, and its minutes SHALL be the sum of the stretches, without the pauses. Blocks with a longer gap, of different items, or not from a timer SHALL stay separate.

#### Scenario: Short pause
- **WHEN** "Thesis" has timer stretches 10:00–10:30 and 10:35–11:00
- **THEN** one block "Thesis" runs from 10:00 to 11:00 with 55 minutes

#### Scenario: Long pause
- **WHEN** "Thesis" has timer stretches 10:00–10:30 and 10:45–11:00
- **THEN** two blocks are drawn

#### Scenario: Running after a short pause
- **WHEN** "Thesis" logged a stretch 09:00–09:30, was resumed at 09:35 and it is 09:50
- **THEN** one block runs from 09:00 to 09:50, marked as running

#### Scenario: Different items
- **WHEN** a timer stretch for "Thesis" ends at 10:30 and one for "Garden" starts at 10:32
- **THEN** two blocks are drawn

#### Scenario: Manual entry
- **WHEN** a Log work entry for "Thesis" ends at 10:00 and a timer stretch for "Thesis" starts at 10:05
- **THEN** two blocks are drawn
