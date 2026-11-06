# Spec Delta

## MODIFIED Requirements

### Requirement: Start a focus session
The user SHALL be able to start a focus session for an open task, an active project or a habit from Home's focus panel, from a row of Home's To do, from the start button of a chip in "Habits due today", and from a task page, with a planned length of 30, 60 or 90 minutes or open-ended. Open-ended SHALL be the default, and the last chosen length (open-ended included) SHALL be remembered on the device. Starting SHALL start the timer (recording what it runs for, the start time and the planned length) and open focus mode. The timer SHALL count from its start time, also while the app is closed or restarted.

#### Scenario: Start from the focus panel
- **WHEN** the user picks the project "Thesis" and 60 minutes in the focus panel and starts
- **THEN** a timer for "Thesis" with 60 planned minutes runs and focus mode opens

#### Scenario: Start from a habit chip
- **WHEN** the user uses the start button of the chip "Run 5 km" in "Habits due today"
- **THEN** a focus session for the habit "Run 5 km" starts with the planned length last chosen

#### Scenario: Start from a row
- **WHEN** the user uses the start action of the To do row "Book venue"
- **THEN** a focus session for "Book venue" starts with the planned length last chosen

#### Scenario: Keeps running while closed
- **WHEN** a timer was started at 09:00 and the app is closed and opened again at 09:40
- **THEN** the timer shows 40 minutes elapsed

#### Scenario: Open-ended by default
- **WHEN** the user opens Home on a new installation
- **THEN** "Open-ended" is selected in the focus panel and a session started without changing it has no planned length

#### Scenario: Last choice remembered
- **WHEN** the user starts a 90-minute session and later returns to Home
- **THEN** 90 minutes is selected

#### Scenario: Open-ended remembered
- **WHEN** the user started a 60-minute session and then a session with "Open-ended"
- **THEN** a start from a To do row has no planned length

#### Scenario: Older stored length
- **WHEN** the stored last length is 25 or 50 minutes from an earlier version
- **THEN** 30 or 60 minutes is selected

### Requirement: Focus panel on Home
Without a running timer, Home's focus panel SHALL offer a text field "What are you working on?" (see "Start with a new task"), the planned lengths 30, 60 and 90 minutes and open-ended, and Start. While the user types, the field SHALL suggest at most 8 open tasks and active habits whose title contains the text (ignoring case), each with its project's colour and name (a habit marked "Habit"); arrow keys and Enter or a click pick a suggestion, and Tab accepts the highlighted suggestion, or the first one when none is highlighted, without starting (Tab without suggestions moves focus on). While a timer runs, the panel SHALL show what the timer runs for, the elapsed time counting up every second (`m:ss`, from one hour on `h:mm:ss`), the planned length and the overtime after it, Stop, Discard and "Focus mode".

#### Scenario: Running timer
- **WHEN** a timer for "Thesis" without planned length has run for 1 hour, 5 minutes and 3 seconds
- **THEN** the focus panel shows "Thesis", "1:05:03", Stop, Discard and "Focus mode"

#### Scenario: Overtime
- **WHEN** a 30-minute session has run for 32 minutes and 10 seconds
- **THEN** the panel shows that the 30 minutes are over and "+2:10" overtime, and the timer keeps running

#### Scenario: No timer
- **WHEN** no timer runs
- **THEN** the focus panel offers the text field, the planned lengths and Start

#### Scenario: Suggestions
- **WHEN** the user types "bench" and the open task "Rerun benchmarks" of "Chapter 4: Evaluation" exists
- **THEN** "Rerun benchmarks" is suggested with the colour and name of "Chapter 4: Evaluation"

#### Scenario: Tab completes
- **WHEN** the user types "bench" and presses Tab
- **THEN** the field shows "Rerun benchmarks" and no session starts

#### Scenario: Tab with the second highlighted
- **WHEN** two suggestions are shown, the second is highlighted and the user presses Tab
- **THEN** the second suggestion is chosen

#### Scenario: Habit suggested
- **WHEN** the user types "run" and the active habit "Run 5 km" of "Training block 3" exists
- **THEN** "Run 5 km" is suggested, marked "Habit", with the colour of "Training block 3"

#### Scenario: Pick with the keyboard
- **WHEN** suggestions are shown and the user presses the down arrow and Enter
- **THEN** the first suggestion is chosen and Start starts a session for it

### Requirement: Stop a timer
Stopping a timer SHALL ask "What did you get done?" with an optional answer, then create a log entry with source `timer`, the answer as its note, the timer's start time as its time, the elapsed whole minutes as its duration (at least 1), and the timer's project, or its task together with the task's project or goal, or its habit together with the habit's project or goal. Stopping SHALL end the timer, close focus mode and show "Work logged". For a habit that is not yet checked today, the dialog SHALL also offer "Mark as done today", on by default; when it is on, stopping SHALL check the habit for today (see habits, "Check habit"). When the timer ran for a task that is done by then and was its project's last next step, the next-step prompt (see tasks) SHALL follow.

#### Scenario: Stop after 45 minutes
- **WHEN** a timer for "Thesis" started at 09:00 is stopped at 09:45
- **THEN** a log entry for "Thesis" at 09:00 with 45 minutes and source timer exists, and no timer runs

#### Scenario: Very short timer
- **WHEN** a timer is stopped after 20 seconds
- **THEN** the entry has a duration of 1 minute

#### Scenario: Timer for a task
- **WHEN** a timer for the task "Book physio", assigned to the goal "Get fit", is stopped
- **THEN** the entry belongs to the task and the goal and is listed on the task page

#### Scenario: Stop note
- **WHEN** the user stops a timer and answers "Drafted chapter 2"
- **THEN** the entry's note is "Drafted chapter 2"

#### Scenario: Habit session logged
- **WHEN** a timer for the habit "Run 5 km" of "Training block 3" is stopped after 40 minutes
- **THEN** a log entry of 40 minutes belongs to the habit and to "Training block 3", counts for its goal, and is shown as a block on the timeline

#### Scenario: Mark habit done on stop
- **WHEN** the user stops a habit session with "Mark as done today" on
- **THEN** the habit is checked for today and shown checked on Home

#### Scenario: Habit not marked
- **WHEN** the user turns "Mark as done today" off and stops a habit session
- **THEN** the time is logged and the habit stays unchecked

#### Scenario: Habit already checked
- **WHEN** a habit that is already checked today is stopped
- **THEN** the dialog does not offer "Mark as done today"

## ADDED Requirements

### Requirement: Start with a new task
Text in the focus panel's field that is not a picked suggestion SHALL be read as `title # project`: the text before the last `#` is the title, the text after it names a project. After `#` the field SHALL suggest the active projects whose name contains the typed text, with their colours. Start SHALL then:
- use the open task whose title equals the title (ignoring case), else the active habit with that title, creating no duplicate;
- otherwise create a task with the title, assigned to the named project, or standalone without `#`;
- with `#` and an empty title, start on the project itself;
and start the session. A project name SHALL match an active project exactly (ignoring case), else the only active project starting with it; when none matches, the field SHALL show "No project named …" and Start SHALL be disabled.

#### Scenario: New task in a project
- **WHEN** the user types "implement new orbit feature # Orbit app rebuild" and starts
- **THEN** the task "implement new orbit feature" is created in "Orbit app rebuild" and a session for it runs

#### Scenario: New standalone task
- **WHEN** the user types "Call the bank" (no open task has that title) and starts
- **THEN** the standalone task "Call the bank" is created and a session for it runs

#### Scenario: Existing task typed
- **WHEN** the user types "rerun benchmarks" and the open task "Rerun benchmarks" exists, and starts
- **THEN** the session runs for "Rerun benchmarks" and no task is created

#### Scenario: Project only
- **WHEN** the user types "# Thesis" and starts
- **THEN** a session for the project "Thesis" runs and no task is created

#### Scenario: Project prefix
- **WHEN** the user types "draft intro # chap" and "Chapter 4: Evaluation" is the only active project starting with "chap"
- **THEN** the new task is assigned to "Chapter 4: Evaluation"

#### Scenario: Unknown project
- **WHEN** the user types "draft intro # garden" and no active project matches "garden"
- **THEN** the field shows "No project named garden" and Start is disabled

#### Scenario: Project suggestions
- **WHEN** the user types "draft intro # port"
- **THEN** "Portfolio site" is suggested with its colour
