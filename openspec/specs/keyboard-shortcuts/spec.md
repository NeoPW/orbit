# keyboard-shortcuts Specification

## Purpose
Makes the desktop and browser app usable from the keyboard: single-key shortcuts for the common actions and screens, keys for Home's To do list and for focus mode, and an overlay that lists them.

## Requirements

### Requirement: Global shortcuts
On the desktop and in the browser the app SHALL react to these keys on every screen: `T` opens New task, `L` opens Log work (both as sheets over the current screen), `F` goes to Home and puts the cursor in the focus field, or opens focus mode while a session exists, `Shift+H` Home, `Shift+P` Plan, `Shift+R` Review, `Shift+S` Settings, `?` the shortcut overlay and `Ctrl+K` the command palette.

#### Scenario: New task from Plan
- **WHEN** the user presses `T` on the Plan screen
- **THEN** the New task sheet opens over Plan and saving it leaves Plan shown

#### Scenario: Log work
- **WHEN** the user presses `L` on a project page
- **THEN** the Log work sheet opens

#### Scenario: Focus field
- **WHEN** no session exists and the user presses `F` on the Review screen
- **THEN** Home is shown with the cursor in "What are you working on?"

#### Scenario: Focus mode with a session
- **WHEN** a session exists and the user presses `F`
- **THEN** focus mode opens

#### Scenario: Switch screens
- **WHEN** the user presses `Shift+P`, then `Shift+R`, then `Shift+H`
- **THEN** Plan, then Review, then Home is shown

### Requirement: Shortcuts only when not typing
Single-key and `Shift` shortcuts SHALL NOT act while the cursor is in a text field, text area or dropdown, while a dialog, sheet, menu or the palette is open, or when `Ctrl`, `Alt` or `Meta` is held (except `Ctrl+K`). The key SHALL then do what it does there normally. `Ctrl+K` SHALL also work from a text field, but not while a dialog or sheet is open.

#### Scenario: Typing a T
- **WHEN** the cursor is in the focus field and the user types "t"
- **THEN** the letter is typed and no sheet opens

#### Scenario: Sheet open
- **WHEN** the New task sheet is open and the user presses `Shift+P` outside its fields
- **THEN** the screen does not change

#### Scenario: Browser shortcut kept
- **WHEN** the user presses `Ctrl+T` in the browser
- **THEN** Orbit does nothing

#### Scenario: Palette from a field
- **WHEN** the cursor is in the focus field and the user presses `Ctrl+K`
- **THEN** the command palette opens

### Requirement: Shortcut overlay
`?` SHALL open an overlay that lists every shortcut with its key, grouped as Global, Home and Focus mode. `Esc` or `?` SHALL close it.

#### Scenario: Open and close
- **WHEN** the user presses `?` and then `Esc`
- **THEN** the overlay with all shortcuts was shown and is closed again

### Requirement: Shortcut hints
Buttons and navigation entries that have a shortcut SHALL show it in their tooltip, for example "New task (T)" and "Plan (Shift+P)".

#### Scenario: Tooltip
- **WHEN** the user hovers "New task" on Home
- **THEN** the tooltip reads "New task (T)"

### Requirement: To do list keys
On Home, `J` or the down arrow SHALL highlight the next To do task (the first one when none or a habit is highlighted) and `K` or the up arrow the previous one; the up arrow on the first task SHALL highlight the first habit due today. The left and right arrows SHALL highlight the previous and next habit (the first one when none is highlighted). `1`–`9` SHALL highlight the 1st–9th To do task; a number without a task does nothing. For a highlighted task, `Space` SHALL start a focus session, `X` SHALL complete it (as its checkbox does, with Undo) and `Enter` SHALL open its page; for a highlighted habit, `Space` SHALL start a focus session and `X` or `Enter` SHALL check or uncheck it. The highlight SHALL be visible, scroll into view and clear when the mouse clicks elsewhere.

#### Scenario: Move and start
- **WHEN** the To do list is "Email supervisor", "Rerun benchmarks" and the user presses `J`, `J` and `Space`
- **THEN** a focus session for "Rerun benchmarks" starts and focus mode opens

#### Scenario: Complete highlighted
- **WHEN** "Email supervisor" is highlighted and the user presses `X`
- **THEN** "Email supervisor" is completed and "Task completed" with Undo is shown

#### Scenario: Open highlighted
- **WHEN** "Rerun benchmarks" is highlighted and the user presses `Enter`
- **THEN** its task page opens

#### Scenario: Highlight by number
- **WHEN** the To do list has three tasks and the user presses `3`
- **THEN** the third task is highlighted and no session starts

#### Scenario: Number beyond the list
- **WHEN** the To do list has two tasks and the user presses `5`
- **THEN** nothing happens

#### Scenario: Habits with the side arrows
- **WHEN** the habits due today are "Stretch", "Run 5 km" and the user presses the right arrow twice and `X`
- **THEN** "Run 5 km" is highlighted and checked for today

#### Scenario: Focus on a habit
- **WHEN** "Stretch" is highlighted and the user presses `Space`
- **THEN** a focus session for "Stretch" starts

### Requirement: Focus mode keys
In focus mode `Space` SHALL pause a running session and resume a paused one, `Enter` SHALL open the complete dialog (where `Enter` completes), `Esc` SHALL leave focus mode, `Delete` SHALL discard (with the confirmation while running), `L` SHALL open the time limit menu, and `+` and `−` SHALL raise or lower the time limit by 5 minutes. `−` SHALL remove a limit of 5 minutes or less; `+` without a limit SHALL set 5 minutes above the worked time, rounded up to whole 5 minutes.

#### Scenario: Pause and resume with Space
- **WHEN** a session runs in focus mode and the user presses `Space` twice
- **THEN** the session was paused, its stretch logged, and runs again

#### Scenario: Complete with Enter
- **WHEN** the user presses `Enter` in focus mode, types "Drafted chapter 2" and presses `Enter`
- **THEN** the session is completed with that note

#### Scenario: Raise the limit
- **WHEN** the session's limit is 30 minutes and the user presses `+`
- **THEN** the limit is 35 minutes

#### Scenario: Lower to no limit
- **WHEN** the session's limit is 5 minutes and the user presses `−`
- **THEN** the session has no limit

#### Scenario: Plus without a limit
- **WHEN** a session without a limit has 12 minutes worked and the user presses `+`
- **THEN** the limit is 20 minutes

#### Scenario: Discard with Delete
- **WHEN** a running session is in focus mode and the user presses `Delete` and confirms
- **THEN** the running stretch is discarded and focus mode closes
