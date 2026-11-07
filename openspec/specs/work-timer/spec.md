# work-timer Specification

## Purpose

Lets the user time work as it happens: one running timer per account for a project or task, visible on Home and on every device, that turns into a log entry when stopped.

## Requirements

### Requirement: One timer at a time
At most one focus session SHALL exist at a time, running or paused. Starting a session while another one exists SHALL first log the other session's running stretch, if any (as in "Pause and resume"), and end it without completing what it ran for.

#### Scenario: Switch to another project
- **WHEN** a timer for "Thesis" has run for 30 minutes and the user starts a timer for "Garden"
- **THEN** a 30-minute timer entry for "Thesis" is logged and a timer for "Garden" runs

#### Scenario: Switch from a paused session
- **WHEN** a session for the task "Book venue" is paused and the user starts a session for "Garden"
- **THEN** no further entry for "Book venue" is logged, "Book venue" stays open and a session for "Garden" runs

### Requirement: Discard a timer
The user SHALL be able to discard the session from the top-right corner of focus mode. Discarding SHALL throw away only the running stretch, after a confirmation, and end the session; stretches already logged by pausing SHALL stay. Discarding a paused session SHALL end it without a confirmation.

#### Scenario: Discard
- **WHEN** the user discards a session that has run since its start without a pause
- **THEN** no session exists and no log entry was created

#### Scenario: Discard after a pause
- **WHEN** a session logged a 30-minute stretch, was resumed and is discarded 10 minutes later
- **THEN** the 30-minute entry stays, no 10-minute entry exists and no session exists

#### Scenario: Discard while paused
- **WHEN** the user discards a paused session
- **THEN** no confirmation is asked, no session exists and the logged stretches stay

### Requirement: Focus panel on Home
Without a session, Home's focus panel SHALL offer a text field "What are you working on?" (see "Start with a new task") and Start, with no choice of length. While the user types, the field SHALL suggest at most 8 open tasks and active habits whose title contains the text (ignoring case), each with its project's colour and name (a habit marked "Habit"); arrow keys and Enter or a click pick a suggestion, and Tab accepts the highlighted suggestion, or the first one when none is highlighted, without starting (Tab without suggestions moves focus on). With a session, the panel SHALL show what it runs for, the worked time (counting up every second while running, `m:ss`, from one hour on `h:mm:ss`), the time limit and overtime, Pause or Resume, Complete and "Focus mode"; a paused session SHALL be marked "Paused".

#### Scenario: Running timer
- **WHEN** a timer for "Thesis" without a time limit has run for 1 hour, 5 minutes and 3 seconds
- **THEN** the focus panel shows "Thesis", "1:05:03", Pause, Complete and "Focus mode"

#### Scenario: Paused session
- **WHEN** a session for "Thesis" is paused at 25 minutes worked
- **THEN** the focus panel shows "Thesis", "Paused", "25:00", Resume, Complete and "Focus mode"

#### Scenario: Overtime
- **WHEN** a session with a 30-minute limit has 32 minutes and 10 seconds worked
- **THEN** the panel shows that the 30 minutes are over and "+2:10" overtime, and the timer keeps running

#### Scenario: No timer
- **WHEN** no session exists
- **THEN** the focus panel offers the text field and Start, and no lengths

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

### Requirement: Target removed while running
When the project, task or habit a session runs for is deleted, completed or otherwise no longer active, the session SHALL keep running or stay paused and SHALL still be pausable, resumable, completable and discardable; its entries SHALL keep the link to that project, task or habit. Completing a session for a task that is already done SHALL log the time and leave the task done.

#### Scenario: Task completed while timing
- **WHEN** a timer runs for the task "Tax return" and the task is completed
- **THEN** the focus panel still shows "Tax return" and completing the session logs the time on that task

### Requirement: Focus mode
Focus mode SHALL fill the window with only what the session runs for, its notes (a task's notes or a project's description), a large timer with the worked time, the time limit and overtime, the time limit control, Pause or Resume and Complete, with Discard in the top-right corner. A paused session SHALL be marked "Paused". Escape or "Leave focus mode" SHALL return to the previous screen while the session stays as it is.

#### Scenario: Open focus mode
- **WHEN** a focus session for "Book venue" with notes "Call three venues" starts
- **THEN** the window shows only "Book venue", "Call three venues", the timer, the time limit control, Pause, Complete and Discard in the top-right corner

#### Scenario: Pause in focus mode
- **WHEN** the user pauses in focus mode
- **THEN** focus mode stays open, shows "Paused" and offers Resume instead of Pause

#### Scenario: Leave without stopping
- **WHEN** the user presses Escape in focus mode
- **THEN** the previous screen is shown and the session is still running

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

### Requirement: Pause and resume
A focus session SHALL be running or paused. Pause SHALL, without a dialog, log the stretch since the last start or resume (as in "Complete a session", without a note) and leave the session paused. Resume SHALL start a new stretch from now. The session's worked time SHALL be the exact time of its stretches (to the second, not their rounded entries) plus the running stretch; it SHALL stand still while paused. The session SHALL stay, running or paused, when focus mode or the app is left.

#### Scenario: Pause logs the stretch
- **WHEN** a session for "Thesis" started at 09:00 is paused at 09:30
- **THEN** a 30-minute timer entry for "Thesis" at 09:00 exists, no dialog was shown and the session is paused at 30 minutes worked

#### Scenario: Resume
- **WHEN** that session is resumed at 09:35 and it is 09:50
- **THEN** the session runs and shows 45 minutes worked

#### Scenario: Paused while away
- **WHEN** the user pauses a session, leaves focus mode and returns an hour later
- **THEN** the session is still paused with the same worked time and offers Resume

#### Scenario: Short stretch
- **WHEN** a session is paused 20 seconds after it was resumed
- **THEN** the logged stretch has 1 minute and the session shows 20 more seconds worked, not a full minute

#### Scenario: Exact over several pauses
- **WHEN** a session has five stretches of 50 seconds each and is paused
- **THEN** the session shows 4:10 worked

### Requirement: Complete a session
Complete SHALL ask "What did you get done?" with an optional note and then end the session. A running stretch SHALL be logged with the note; when paused, a non-empty note SHALL be set on the last logged stretch. An entry has source `timer`, the stretch's start as its time, its whole minutes (at least 1) and the session's project, or task with its project or goal, or habit with its project or goal. Completing SHALL mark a task done (with the next-step prompt, see tasks), offer "Mark as done today" for a habit not yet checked today (on by default) and only end a project session; it then shows "Work logged".

#### Scenario: Complete a task session
- **WHEN** a session for the task "Book venue" started at 14:00 is completed at 14:40 with the note "Called three venues"
- **THEN** a 40-minute entry at 14:00 with that note exists, "Book venue" is done and no session exists

#### Scenario: Complete while paused
- **WHEN** a session for "Thesis" is paused and then completed with the note "Drafted chapter 2"
- **THEN** no new entry is created, the last logged stretch has the note "Drafted chapter 2" and no session exists

#### Scenario: Complete a habit session
- **WHEN** a session for the habit "Run 5 km" of "Training block 3" is completed after 40 minutes with "Mark as done today" on
- **THEN** a 40-minute entry belongs to the habit and "Training block 3", and the habit is checked for today

#### Scenario: Habit not marked
- **WHEN** the user turns "Mark as done today" off and completes a habit session
- **THEN** the time is logged and the habit stays unchecked

#### Scenario: Habit already checked
- **WHEN** a session for a habit that is already checked today is completed
- **THEN** the dialog does not offer "Mark as done today"

#### Scenario: Complete a project session
- **WHEN** a session for the project "Thesis" is completed
- **THEN** the stretch is logged on "Thesis", the project stays as it was and no session exists

#### Scenario: Task for a goal
- **WHEN** a session for the task "Book physio", assigned to the goal "Get fit", is completed
- **THEN** the entry belongs to the task and the goal and is listed on the task page

#### Scenario: Last next step
- **WHEN** a session for the last open next step of an active project is completed
- **THEN** the task is done and "What's the next step?" follows

### Requirement: Time limit
Focus mode SHALL offer a time limit for the session: 15, 30, 45, 60 or 90 minutes, any other whole number of minutes, or no limit. It SHALL be changeable and removable while the session runs or is paused. The limit SHALL apply to the session's worked time; after it, the timer SHALL show the overtime and keep running. A new session SHALL start without a limit.

#### Scenario: Set a limit
- **WHEN** the user sets a 45-minute limit in focus mode of a session that has 10 minutes worked
- **THEN** the timer shows the 45-minute limit and keeps counting the worked time

#### Scenario: Overtime
- **WHEN** a session with a 30-minute limit has 32 minutes and 10 seconds worked
- **THEN** the timer shows that the 30 minutes are over and "+2:10" overtime, and keeps running

#### Scenario: Custom limit
- **WHEN** the user enters 20 minutes as the limit
- **THEN** the session's limit is 20 minutes

#### Scenario: Remove the limit
- **WHEN** the user chooses "No limit" for a session with a limit
- **THEN** the timer shows no limit and no overtime

### Requirement: Start a session
The user SHALL be able to start a focus session for an open task, an active project or a habit from Home's focus panel, from a row of Home's To do, from the start button of a chip in "Habits due today", and from a task page. Starting SHALL NOT ask for a length: the session SHALL start running without a time limit (see "Time limit"), recording what it runs for and the start time, and open focus mode. The timer SHALL count from its start time, also while the app is closed or restarted.

#### Scenario: Start from the focus panel
- **WHEN** the user picks the project "Thesis" in the focus panel and starts
- **THEN** a session for "Thesis" without a time limit runs and focus mode opens

#### Scenario: Start from a habit chip
- **WHEN** the user uses the start button of the chip "Run 5 km" in "Habits due today"
- **THEN** a session for the habit "Run 5 km" without a time limit runs

#### Scenario: Start from a row
- **WHEN** the user uses the start action of the To do row "Book venue"
- **THEN** a session for "Book venue" without a time limit runs

#### Scenario: Start from a task page
- **WHEN** the user uses "Start focus" on the task page of "Book venue"
- **THEN** a session for "Book venue" runs without first choosing a length

#### Scenario: Keeps running while closed
- **WHEN** a timer was started at 09:00 and the app is closed and opened again at 09:40
- **THEN** the timer shows 40 minutes elapsed

### Requirement: Session across devices
The session SHALL be synced like other records, so a session started on one device is shown, and can be paused, resumed, completed or discarded, on the other device after sync, with the same state (running or paused), worked time and time limit. There SHALL be one timer record per account: when sessions are started on two devices before they sync, the later start SHALL win and the earlier one SHALL end without a log entry for its running stretch.

#### Scenario: Complete in the browser
- **WHEN** a session started on the phone has synced and the user completes it in the browser
- **THEN** the browser logs the entry, and after the next sync the phone shows no session and the entry

#### Scenario: Paused on another device
- **WHEN** the desktop pauses a session and both devices sync
- **THEN** the phone shows the session as paused with the same worked time

#### Scenario: Started on both devices
- **WHEN** the phone starts a timer for "Thesis" at 09:00 and the browser, not yet synced, starts one for "Garden" at 09:05
- **THEN** after both have synced, the timer for "Garden" runs on both devices

### Requirement: Focus session on the phone
The phone SHALL offer the same focus panel, start actions, focus mode, pause, resume, complete dialog, discard and time limit as the desktop (see "Start a session", "Pause and resume", "Complete a session" and "Focus panel on Home"). A running session SHALL keep its start time while the app is in the background, the screen is off or the app was closed, and show the correct worked time when the app is opened again. Starting a session on the phone SHALL replace a session on another device after they sync, as there is one timer for all devices.

#### Scenario: Start on the phone
- **WHEN** the user types a task in the focus panel on the phone and starts
- **THEN** a timer for the task runs and focus mode opens full screen

#### Scenario: Screen off
- **WHEN** a session started at 09:00 runs while the phone's screen is off and the app is opened again at 09:40
- **THEN** the timer shows 40 minutes worked

#### Scenario: Complete on the phone
- **WHEN** the user completes the session on the phone and answers "Drafted chapter 2"
- **THEN** a log entry with that note and the stretch's minutes exists and "Work logged" is shown

#### Scenario: Started on the phone, seen on the desktop
- **WHEN** a session is started on the phone and both devices sync
- **THEN** the desktop shows the same running session with the same start time
