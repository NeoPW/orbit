# Spec Delta

## Purpose

Keeps one free note per local calendar day, written on Home, for thoughts and reminders that belong to the day rather than to a project or goal.

## ADDED Requirements

### Requirement: One note per day
There SHALL be at most one daily note per local calendar day. Writing the note of a day that already has one SHALL change that note. The same day's note written on two devices before they sync SHALL end up as one note (the later edit wins).

#### Scenario: Change the note
- **WHEN** 2026-11-09 has the note "Call the bank" and the user changes it to "Call the bank, then gym"
- **THEN** 2026-11-09 has one note, "Call the bank, then gym"

#### Scenario: Two devices
- **WHEN** the desktop and the phone both write a note for 2026-11-09 before syncing
- **THEN** after both have synced there is one note for that day, the one written last

### Requirement: Daily note saved as written
The daily note SHALL be saved while it is written, without a save button: shortly after typing stops, when the field loses focus and when Home is left. An emptied note SHALL be deleted. Blank lines at the start and spaces and blank lines at the end SHALL be dropped when saving; the indentation of the first line SHALL be kept.

#### Scenario: Leave Home
- **WHEN** the user types "Call the bank" in the note and switches to Plan
- **THEN** the note of today is "Call the bank"

#### Scenario: Empty note
- **WHEN** the user clears today's note
- **THEN** today has no daily note

#### Scenario: Only spaces
- **WHEN** the user's note contains only spaces and blank lines
- **THEN** today has no daily note

### Requirement: Earlier notes are kept
A daily note SHALL stay stored after its day has passed, and a new day SHALL start without a note.

#### Scenario: Next day
- **WHEN** 2026-11-09 has the note "Call the bank" and it is now 2026-11-10
- **THEN** 2026-11-10 has no note and the note of 2026-11-09 still exists

### Requirement: Outline editing
While the note is edited, pressing Enter at the end of a list line (`- `, `* ` or `- [ ] `, with any indentation) SHALL start the next line with the same indentation and marker (an unchecked `- [ ] ` after a checkbox line). Pressing Enter on a line holding only a marker SHALL remove the marker instead. On a list line, Tab SHALL indent it by two spaces and Shift+Tab SHALL remove up to two spaces; elsewhere Tab SHALL move the focus as usual. These edits SHALL be undoable like typing.

#### Scenario: Continue a bullet
- **WHEN** the note is "- Call the bank" with the cursor at its end and the user presses Enter
- **THEN** the note is "- Call the bank\n- " with the cursor at the end

#### Scenario: Continue a checkbox
- **WHEN** the note is "  - [x] Gym" with the cursor at its end and the user presses Enter
- **THEN** the note is "  - [x] Gym\n  - [ ] " with the cursor at the end

#### Scenario: End the list
- **WHEN** the last line is "- " with the cursor at its end and the user presses Enter
- **THEN** that line becomes empty and no new line is added

#### Scenario: Indent and outdent
- **WHEN** the cursor is on the line "- Groceries" and the user presses Tab, then Shift+Tab
- **THEN** the line reads "  - Groceries", then "- Groceries" again

#### Scenario: Plain line
- **WHEN** the cursor is on the line "Call the bank" and the user presses Tab
- **THEN** the note is unchanged and the focus moves on

### Requirement: Formatted note
While the note field is not focused and the note is not empty, the note SHALL be shown formatted: lines starting with `# `, `## ` or `### ` as headings, `- ` or `* ` lines as bullets nested by indentation (two spaces per level), `- [ ] ` and `- [x] ` lines as checkboxes, `**text**` as bold, `*text*` or `_text_` as italic and `` `text` `` as code; everything else as plain text, with line breaks kept. Text SHALL never be interpreted as HTML. Clicking the formatted note outside a checkbox, or focusing it and pressing Enter, SHALL switch to the text field with the cursor at the end. An empty note SHALL show the text field.

#### Scenario: Headings, bullets and emphasis
- **WHEN** the note is "# Plan\n- **Call** the bank\n  - ask about _fees_" and the field is not focused
- **THEN** it shows the heading "Plan", a bullet with "Call" in bold, and below it an indented bullet with "fees" in italic

#### Scenario: HTML stays text
- **WHEN** the note is "<b>hi</b>"
- **THEN** the formatted note shows the text "<b>hi</b>"

#### Scenario: Back to editing
- **WHEN** the user clicks the formatted note outside its checkboxes
- **THEN** the text field shows the note's text with the cursor at the end

### Requirement: Tick a checkbox in the note
Clicking a checkbox in the formatted note SHALL toggle that line between `- [ ] ` and `- [x] ` and save the note, without switching to the text field.

#### Scenario: Tick
- **WHEN** the note is "- [ ] Gym\n- [ ] Read" and the user clicks the checkbox of "Read"
- **THEN** the note is "- [ ] Gym\n- [x] Read" and it is still shown formatted
