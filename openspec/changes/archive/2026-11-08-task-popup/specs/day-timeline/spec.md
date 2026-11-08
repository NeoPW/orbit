## MODIFIED Requirements

### Requirement: Open from a block
Clicking a block or dot SHALL open the task it belongs to in the task popup (see tasks, "Task popup"), else (for a habit) its project, else its goal; an entry without any of them is not clickable.

#### Scenario: Open the task
- **WHEN** the user clicks a block of the task "Rerun benchmarks"
- **THEN** the popup of "Rerun benchmarks" opens over the current screen

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
