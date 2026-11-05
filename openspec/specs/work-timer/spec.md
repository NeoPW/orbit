# work-timer Specification

## Purpose

Lets the user time work as it happens: one running timer per account for a project or task, visible on Home and on every device, that turns into a log entry when stopped.

## Requirements

### Requirement: Start a focus session
The user SHALL be able to start a focus session for an open task or an active project from Home's focus panel, from a row of Home's To do, and from a task page, with a planned length of 25, 50 or 90 minutes or open-ended. Starting SHALL start the timer (recording what it runs for, the start time and the planned length) and open focus mode. The timer SHALL count from its start time, also while the app is closed or restarted.

#### Scenario: Start from the focus panel
- **WHEN** the user picks the project "Thesis" and 50 minutes in the focus panel and starts
- **THEN** a timer for "Thesis" with 50 planned minutes runs and focus mode opens

#### Scenario: Start from a row
- **WHEN** the user uses the start action of the To do row "Book venue"
- **THEN** a focus session for "Book venue" starts with the planned length last chosen

#### Scenario: Keeps running while closed
- **WHEN** a timer was started at 09:00 and the app is closed and opened again at 09:40
- **THEN** the timer shows 40 minutes elapsed

### Requirement: One timer at a time
At most one timer SHALL run at a time. Starting a timer while another one runs SHALL first stop the running timer, logging its time as defined in "Stop a timer".

#### Scenario: Switch to another project
- **WHEN** a timer for "Thesis" has run for 30 minutes and the user starts a timer for "Garden"
- **THEN** a 30-minute timer entry for "Thesis" is logged and a timer for "Garden" runs

### Requirement: Stop a timer
Stopping a timer SHALL ask "What did you get done?" with an optional answer, then create a log entry with source `timer`, the answer as its note, the timer's start time as its time, the elapsed whole minutes as its duration (at least 1), and the timer's project, or its task together with the task's project or goal. Stopping SHALL end the timer, close focus mode and show "Work logged". When the timer ran for a task that is done by then and was its project's last next step, the next-step prompt (see tasks) SHALL follow.

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

### Requirement: Discard a timer
The user SHALL be able to discard a running timer. Discarding SHALL end the timer without creating a log entry.

#### Scenario: Discard
- **WHEN** the user discards a running timer
- **THEN** no timer runs and no log entry was created

### Requirement: Focus panel on Home
Without a running timer, Home's focus panel SHALL offer the choice of a task (from the To do list) or an active project, the planned lengths 25, 50 and 90 minutes and open-ended, and Start. While a timer runs, it SHALL show what the timer runs for, the elapsed time counting up every second (`m:ss`, from one hour on `h:mm:ss`), the planned length and the overtime after it, Stop, Discard and "Focus mode".

#### Scenario: Running timer
- **WHEN** a timer for "Thesis" without planned length has run for 1 hour, 5 minutes and 3 seconds
- **THEN** the focus panel shows "Thesis", "1:05:03", Stop, Discard and "Focus mode"

#### Scenario: Overtime
- **WHEN** a 25-minute session has run for 27 minutes and 10 seconds
- **THEN** the panel shows that the 25 minutes are over and "+2:10" overtime, and the timer keeps running

#### Scenario: No timer
- **WHEN** no timer runs
- **THEN** the focus panel offers a task or project, the planned lengths and Start

### Requirement: Timer across devices
The running timer SHALL be synced like other records, so a timer started on one device is shown, and can be stopped or discarded, on the other device after sync. There SHALL be one timer record per account: when timers are started on two devices before they sync, the later start SHALL win and the earlier one SHALL end without a log entry.

#### Scenario: Stop in the browser
- **WHEN** a timer started on the phone has synced and the user stops it in the browser
- **THEN** the browser logs the entry, and after the next sync the phone shows no timer and the entry

#### Scenario: Started on both devices
- **WHEN** the phone starts a timer for "Thesis" at 09:00 and the browser, not yet synced, starts one for "Garden" at 09:05
- **THEN** after both have synced, the timer for "Garden" runs on both devices

### Requirement: Target removed while running
When the project or task a timer runs for is deleted, completed or otherwise no longer active, the timer SHALL keep running and SHALL still be stoppable; its entry SHALL keep the link to that project or task.

#### Scenario: Task completed while timing
- **WHEN** a timer runs for the task "Tax return" and the task is completed
- **THEN** the focus panel still shows "Tax return" and stopping it logs the time on that task

### Requirement: Focus mode
Focus mode SHALL fill the window with only what the timer runs for, its notes (a task's notes or a project's description), a large timer with the planned length and overtime, Stop and Discard. Escape or "Leave focus mode" SHALL return to the previous screen while the timer keeps running.

#### Scenario: Open focus mode
- **WHEN** a focus session for "Book venue" with notes "Call three venues" starts
- **THEN** the window shows only "Book venue", "Call three venues", the timer, Stop and Discard

#### Scenario: Leave without stopping
- **WHEN** the user presses Escape in focus mode
- **THEN** the previous screen is shown and the timer still runs
