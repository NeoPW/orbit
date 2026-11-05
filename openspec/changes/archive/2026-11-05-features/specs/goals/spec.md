# Spec Delta

## MODIFIED Requirements

### Requirement: Goal deadline badge
An active goal SHALL show a deadline badge for its end date wherever it is listed and on its page, as defined in visual-design ("Deadline badge text"): amber when the end date is within the deadline lead time, red "Overdue" when the end date has passed, the date otherwise. Completed and archived goals SHALL NOT show a deadline badge.

#### Scenario: Overdue goal
- **WHEN** today is 2026-10-07 and an active goal ended on 2026-09-30
- **THEN** it shows a red "Overdue" badge

#### Scenario: Ending soon
- **WHEN** the lead time is 7 days and an active goal ends in 3 days
- **THEN** its badge is amber and reads "In 3 days"

#### Scenario: Completed goal
- **WHEN** a completed goal's end date has passed
- **THEN** it is not marked overdue

### Requirement: Goal page
Every goal SHALL have a page with its own address (see app-shell). It SHALL show a header with the goal's color, title, progress, date range, a status chip and the deadline badge, then the description and the sections measures, projects, tasks and habits, work, and weekly notes (see weekly-notes). The page SHALL offer Edit and Delete; the status chip SHALL offer the other statuses in a menu and change the status immediately.

#### Scenario: Open from Plan
- **WHEN** the user clicks the goal "Get fit" in Plan
- **THEN** the goal page opens with its date range, measures, projects and work, not the edit form

#### Scenario: Complete from the status chip
- **WHEN** the user chooses "Completed" in the status chip of an active goal
- **THEN** the goal's status is completed and it is listed in the Archive

#### Scenario: Missing goal
- **WHEN** the page of a deleted goal is opened
- **THEN** it says the goal was not found

### Requirement: Goal page updates live
The goal page SHALL update immediately after changes to the goal, its measures, the projects serving it, its tasks and habits, log entries and weekly notes, also after a sync.

#### Scenario: Measure changed
- **WHEN** the user raises a measure on the goal page
- **THEN** the goal's progress and its progress bar update without a reload

## ADDED Requirements

### Requirement: Goal color swatches
The goal form SHALL offer the colors of the goal palette as swatches, and "Auto". A goal with "Auto" SHALL get a palette color by its position in the goal order, so neighboring goals differ. The goal's color SHALL mark the goal in Plan and on its page and SHALL color the progress bars of the goal and its measures.

#### Scenario: Pick a color
- **WHEN** the user picks the rose color for "Get fit" and saves
- **THEN** "Get fit" is marked rose in Plan and its progress bars are rose

#### Scenario: Back to Auto
- **WHEN** the user chooses Auto for a goal with its own color and saves
- **THEN** the goal has no own color and uses the palette color of its position

## REMOVED Requirements

### Requirement: Goal color
**Reason**: Goals are no longer shown as planets (no space visuals in Plan, SPEC §6.4) and measures use bars instead of rings.
**Migration**: Replaced by "Goal color swatches"; stored colors keep working.
