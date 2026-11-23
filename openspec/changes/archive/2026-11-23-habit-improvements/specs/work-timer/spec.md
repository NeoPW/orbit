## MODIFIED Requirements

### Requirement: Time limit
Focus mode SHALL offer a time limit for the session: 15, 30, 45, 60 or 90 minutes, any other whole number of minutes, or no limit. It SHALL be changeable and removable while the session runs or is paused. The limit SHALL apply to the session's worked time; after it, the timer SHALL show the overtime and keep running. A new session SHALL start without a limit, except a session for a habit with a duration, which SHALL start with that duration as its limit (see "Start a session").

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

#### Scenario: Change a habit's limit
- **WHEN** a session for a habit with a duration of 20 minutes runs and the user sets the limit to 30 minutes
- **THEN** the session's limit is 30 minutes and the habit's duration stays 20 minutes

### Requirement: Start a session
The user SHALL be able to start a focus session for an open task, an active project or a habit from Home's focus panel, from a row of Home's To do, from the start button of a chip in "Habits due today", and from a task page. Starting SHALL NOT ask for a length: the session SHALL start running without a time limit (see "Time limit"), or, for a habit with a duration (see habits, "Habit duration"), with that duration as its time limit, wherever it is started. It SHALL record what it runs for and the start time, and open focus mode. The timer SHALL count from its start time, also while the app is closed or restarted.

#### Scenario: Start from the focus panel
- **WHEN** the user picks the project "Thesis" in the focus panel and starts
- **THEN** a session for "Thesis" without a time limit runs and focus mode opens

#### Scenario: Start from a habit chip
- **WHEN** the user uses the start button of the chip "Run 5 km", a habit without a duration, in "Habits due today"
- **THEN** a session for the habit "Run 5 km" without a time limit runs

#### Scenario: Habit with a duration
- **WHEN** the user uses the start button of the chip "Stretch", a habit with a duration of 20 minutes
- **THEN** a session for "Stretch" with a 20-minute time limit runs

#### Scenario: Habit with a duration from the focus panel
- **WHEN** the user types "stretch" in the focus panel, picks the habit "Stretch" with a duration of 20 minutes and starts
- **THEN** a session for "Stretch" with a 20-minute time limit runs

#### Scenario: Habit with a duration on the phone
- **WHEN** the user starts "Stretch", a habit with a duration of 20 minutes, from its chip on the phone
- **THEN** a session with a 20-minute time limit runs and its limit notification is scheduled for 20 minutes worked

#### Scenario: Start from a row
- **WHEN** the user uses the start action of the To do row "Book venue"
- **THEN** a session for "Book venue" without a time limit runs

#### Scenario: Start from a task page
- **WHEN** the user uses "Start focus" on the task page of "Book venue"
- **THEN** a session for "Book venue" runs without first choosing a length

#### Scenario: Keeps running while closed
- **WHEN** a timer was started at 09:00 and the app is closed and opened again at 09:40
- **THEN** the timer shows 40 minutes elapsed
