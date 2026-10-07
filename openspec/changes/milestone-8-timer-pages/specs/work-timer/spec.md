# Spec Delta

## Purpose

Lets the user time work as it happens: one running timer per account for a project or task, visible on Home and on every device, that turns into a log entry when stopped.

## ADDED Requirements

### Requirement: Start a timer
The user SHALL be able to start a timer for an active project or an open task outside projects from quick log (see work-log). A started timer SHALL record what it runs for and its start time, and SHALL count from that start time, also while the app is closed or restarted.

#### Scenario: Start for a project
- **WHEN** the user switches quick log to "Start timer" and taps the project "Thesis"
- **THEN** a timer for "Thesis" runs from the current time and quick log closes

#### Scenario: Keeps running while closed
- **WHEN** a timer was started at 09:00 and the app is closed and opened again at 09:40
- **THEN** the timer shows 40 minutes elapsed

### Requirement: One timer at a time
At most one timer SHALL run at a time. Starting a timer while another one runs SHALL first stop the running timer, logging its time as defined in "Stop a timer".

#### Scenario: Switch to another project
- **WHEN** a timer for "Thesis" has run for 30 minutes and the user starts a timer for "Garden"
- **THEN** a 30-minute timer entry for "Thesis" is logged and a timer for "Garden" runs

### Requirement: Stop a timer
Stopping a timer SHALL create a log entry with source `timer`, the timer's start time as its time, the elapsed whole minutes as its duration (at least 1), and the timer's project, or its task together with the task's project or KR. Stopping SHALL end the timer and confirm the entry.

#### Scenario: Stop after 45 minutes
- **WHEN** a timer for "Thesis" started at 09:00 is stopped at 09:45
- **THEN** a log entry for "Thesis" at 09:00 with 45 minutes and source timer exists, and no timer runs

#### Scenario: Very short timer
- **WHEN** a timer is stopped after 20 seconds
- **THEN** the entry has a duration of 1 minute

#### Scenario: Timer for a task
- **WHEN** a timer for the task "Book physio", assigned to the KR "Run 100 km", is stopped
- **THEN** the entry belongs to the task and the KR and is listed on the task page

### Requirement: Discard a timer
The user SHALL be able to discard a running timer. Discarding SHALL end the timer without creating a log entry.

#### Scenario: Discard
- **WHEN** the user discards a running timer
- **THEN** no timer runs and no log entry was created

### Requirement: Timer card on Home
While a timer runs, Home SHALL show a timer card directly below the today header with what the timer runs for, the elapsed time counting up every second (as `m:ss`, from one hour on as `h:mm:ss`), a Stop action and a Discard action. Without a running timer, no card SHALL be shown.

#### Scenario: Running timer
- **WHEN** a timer for "Thesis" has run for 1 hour, 5 minutes and 3 seconds
- **THEN** Home shows a card "Thesis" with "1:05:03", Stop and Discard

#### Scenario: No timer
- **WHEN** no timer runs
- **THEN** Home shows no timer card

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
- **THEN** the timer card still shows "Tax return" and stopping it logs the time on that task
