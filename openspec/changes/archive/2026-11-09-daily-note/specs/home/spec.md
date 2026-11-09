# Spec Delta

## MODIFIED Requirements

### Requirement: Home layout
Home SHALL show a main column with, from top to bottom, today's weekday and date with "New task" and "Log work" next to it, the focus panel (see work-timer), "Today's note", "Habits due today", "To do" and "Done today", and a side column with the "Today" timeline (see day-timeline) above the active projects. Below 960 pixels window width the side column SHALL move below the main column. A section without items SHALL show an empty state, except "Done today", which SHALL be hidden while no task was completed today.

#### Scenario: Wide window
- **WHEN** Home is shown in a 1280 pixel wide window
- **THEN** the Today timeline and below it the active projects are shown in a column to the right of the main column

#### Scenario: Empty section
- **WHEN** no habit is due today
- **THEN** "Habits due today" shows an empty state and the other sections are still shown

#### Scenario: Timeline above projects
- **WHEN** Home is shown
- **THEN** the Today timeline is directly above "Active projects" in the side column

#### Scenario: Nothing done yet
- **WHEN** no task was completed today
- **THEN** "Done today" is not shown

#### Scenario: Note under the focus panel
- **WHEN** Home is shown
- **THEN** "Today's note" is directly below the focus panel and above "Habits due today"

## ADDED Requirements

### Requirement: Today's note on Home
"Today's note" SHALL hold the daily note of the current day (see daily-notes), shown formatted or as a multi-line text field as daily-notes describes, and empty when the day has none. When the date changes while Home is open, or Home is shown again on a later date, the field SHALL show the new day's note after saving what was typed.

#### Scenario: Note shown again
- **WHEN** today has the note "Call the bank" and the user opens Home
- **THEN** "Today's note" shows "Call the bank"

#### Scenario: New day
- **WHEN** the user typed "Call the bank" on 2026-11-09 and Home is shown again on 2026-11-10
- **THEN** "Today's note" is empty and the note of 2026-11-09 is "Call the bank"
