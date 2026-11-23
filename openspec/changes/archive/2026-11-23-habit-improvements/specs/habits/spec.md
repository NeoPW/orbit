## ADDED Requirements

### Requirement: Habit duration
A habit SHALL have an optional duration, a whole number of minutes from 1 to 1440, set in the habit's form and clearable there. A habit with a duration SHALL show it after its schedule summary. Changing the duration SHALL NOT change a focus session that already runs for the habit.

#### Scenario: Set a duration
- **WHEN** the user creates the daily habit "Stretch" with a duration of 20 minutes
- **THEN** the Habits list shows "Stretch" with "Daily · 20 min"

#### Scenario: No duration
- **WHEN** the user saves a habit with the duration field empty
- **THEN** the habit is saved without a duration and its summary shows only the schedule

#### Scenario: Invalid duration
- **WHEN** the user enters 0 or 2.5 as the duration
- **THEN** the habit is not saved and the field shows an error

#### Scenario: Clear the duration
- **WHEN** the user clears the duration of "Stretch" and saves
- **THEN** "Stretch" has no duration

### Requirement: Check habit for yesterday
Checking a habit for yesterday SHALL create a habit check for yesterday's local date and a log entry as in "Check habit", except that the entry's time SHALL be yesterday at the habit's reminder time, else yesterday at 12:00. Unchecking it SHALL remove that check and its log entry. Checks SHALL only be made or removed for today and yesterday; earlier dates SHALL NOT be offered. A late check SHALL count for "Habit due today" and "Habit streak" like any check of that date.

#### Scenario: Check yesterday
- **WHEN** it is 2026-11-08 and the user checks the habit "Run" with reminder time 07:30 for yesterday
- **THEN** a check dated 2026-11-07 exists with a log entry "Run" from source habit at 2026-11-07 07:30

#### Scenario: Without a reminder time
- **WHEN** the user checks a habit without a reminder time for yesterday
- **THEN** its log entry is at 12:00 yesterday

#### Scenario: Streak repaired
- **WHEN** a daily habit was checked on 2026-11-04, 05 and 06, it is 2026-11-08 and the user checks it for 2026-11-07
- **THEN** its current streak is 4 days

#### Scenario: Last week's target
- **WHEN** it is Monday 2026-11-09, a habit with 3 times per week has 2 check-ins in the week of 2026-11-02 and the user checks it for Sunday 2026-11-08
- **THEN** that week reached its target and counts for the streak

#### Scenario: Uncheck yesterday
- **WHEN** the user unchecks a habit's check of yesterday
- **THEN** the check and its log entry are gone

#### Scenario: No duplicate check
- **WHEN** a habit is already checked for yesterday and a check for yesterday is requested again
- **THEN** there is still exactly one check and one log entry for yesterday

### Requirement: Done yesterday in the habit sheet
The sheet of an existing habit SHALL show a "Done yesterday" toggle when the habit is active and scheduled on yesterday's weekday (`daily` always, `weekdays` when yesterday is one of them, `times_per_week` always), or when it is already checked for yesterday. Turning it on SHALL check the habit for yesterday and turning it off SHALL uncheck it (see "Check habit for yesterday"), at once and independent of saving or cancelling the form. The sheet for a new habit SHALL NOT show it.

#### Scenario: Tick yesterday
- **WHEN** the daily habit "Stretch" was not checked yesterday and the user opens it in Plan and turns on "Done yesterday"
- **THEN** "Stretch" is checked for yesterday, also after the sheet is cancelled

#### Scenario: Not scheduled yesterday
- **WHEN** a habit for Monday, Wednesday and Friday is opened on a Wednesday
- **THEN** its sheet shows no "Done yesterday" toggle

#### Scenario: Inactive habit
- **WHEN** an inactive habit that was not checked yesterday is opened
- **THEN** its sheet shows no "Done yesterday" toggle

#### Scenario: Checked but not scheduled
- **WHEN** a habit checked for yesterday is no longer scheduled on yesterday's weekday
- **THEN** its sheet shows "Done yesterday" turned on, so it can be unchecked
