# Spec Delta

## ADDED Requirements

### Requirement: Save a form with Shift+Enter
In every form (each sheet, each dialog with fields, such as completing a session, the next-step prompt and a custom time limit, and the forms on screens, such as the sync connection and a workout set), Shift+Enter SHALL save or confirm the form like its main button, from any of its fields. In a text area, Enter alone SHALL still add a new line. While the main button is disabled, Shift+Enter SHALL do nothing. Text typed in a date or time field SHALL be read before saving.

#### Scenario: Save from the notes
- **WHEN** the cursor is in the notes of the New task sheet with the title "Tax return" and the user presses Shift+Enter
- **THEN** the task "Tax return" is created with those notes and the sheet closes

#### Scenario: Enter in notes
- **WHEN** the cursor is in the notes of the New task sheet and the user presses Enter
- **THEN** a new line is added and the sheet stays open

#### Scenario: Complete a session
- **WHEN** the complete dialog of a session is open with "Drafted chapter 2" typed and the user presses Shift+Enter
- **THEN** the session is completed with that note

#### Scenario: Save disabled
- **WHEN** the due date of the New task sheet holds text that is not a date and the user presses Shift+Enter
- **THEN** nothing is saved and the sheet stays open

#### Scenario: Typed date read first
- **WHEN** the user types "Tax return" as title, then "27-11-2026" in the due date and presses Shift+Enter while still in the due date
- **THEN** the task is created due 27-11-2026

#### Scenario: In the overlay
- **WHEN** the shortcut overlay is open
- **THEN** it lists Shift+Enter as "Save a form" under Global
