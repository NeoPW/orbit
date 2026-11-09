# Spec Delta

## ADDED Requirements

### Requirement: Daily note key
On the desktop and in the browser, `N` SHALL go to Home and put the cursor at the end of "Today's note" in its editing form (see daily-notes, "Formatted note"), on every screen. Like the other shortcuts it SHALL NOT fire while typing in a field or while a dialog, sheet or menu is open, and SHALL be listed in the shortcut overlay under Global.

#### Scenario: From Plan
- **WHEN** today's note is "Call the bank" and the user presses `N` on the Plan screen
- **THEN** Home is shown and the cursor is at the end of "Call the bank" in the note's text field

#### Scenario: Not while typing
- **WHEN** the focus field has keyboard focus and the user types "n"
- **THEN** the note does not get the cursor
