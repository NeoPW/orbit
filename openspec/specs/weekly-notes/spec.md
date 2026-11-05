# weekly-notes Specification

## Purpose

Keeps one short note per project or goal and week, written during the weekly review, so the history of a project or goal can be read back week by week.

## Requirements

### Requirement: One note per item and week
A project or goal SHALL have at most one weekly note per Monday–Sunday week. Writing a note for a week that already has one SHALL change that note. The same note written on two devices before they sync SHALL end up as one note (the later edit wins).

#### Scenario: Change a note
- **WHEN** "Garden" has the note "Beds prepared" for a week and the user changes it to "Beds and seeds"
- **THEN** "Garden" has one note for that week, "Beds and seeds"

#### Scenario: Two devices
- **WHEN** the desktop and the browser both write a note for "Garden" and the same week before syncing
- **THEN** after both have synced there is one note, the one written last

### Requirement: Notes saved as written
A weekly note SHALL be saved while it is written, without a save button, at the latest when the field loses focus or the step is left. An emptied note SHALL be deleted.

#### Scenario: Leave the step
- **WHEN** the user types a note in the projects step and clicks Next
- **THEN** the note is saved

#### Scenario: Empty note
- **WHEN** the user clears the note of "Garden" for the review week
- **THEN** "Garden" has no note for that week

### Requirement: Notes on project and goal pages
The project detail and the goal page SHALL list the item's weekly notes, newest week first, each with its week as `dd-mm-yyyy – dd-mm-yyyy`. Without notes the section SHALL show an empty state.

#### Scenario: Newest first
- **WHEN** "Garden" has notes for the weeks starting 2026-10-05 and 2026-10-12
- **THEN** the note of 12-10-2026 – 18-10-2026 is listed first

### Requirement: Notes with a past review
A past review in the history SHALL show the weekly notes of its week, with the project or goal each belongs to.

#### Scenario: Open a past review
- **WHEN** the user opens the review of the week starting 2026-10-05, in which "Garden" got the note "Beds prepared"
- **THEN** the page lists "Garden" with "Beds prepared"
