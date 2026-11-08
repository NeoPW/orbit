# keyboard-shortcuts Specification

## Purpose
Makes the desktop and browser app usable from the keyboard: single-key shortcuts for the common actions and screens, keys for Home's To do list and for focus mode, and an overlay that lists them.

## Requirements

### Requirement: Global shortcuts
On the desktop and in the browser the app SHALL react to these keys on every screen: `T` opens New task, `L` opens Log work (both as sheets over the current screen), `F` goes to Home and puts the cursor in the focus field (also while a session is paused), or opens focus mode while a session runs, `Shift+H` Home, `Shift+P` Plan, `Shift+R` Review, `Shift+S` Settings, `?` the shortcut overlay and `Ctrl+K` the command palette.

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
- **WHEN** a session runs and the user presses `F`
- **THEN** focus mode opens

#### Scenario: Focus field while paused
- **WHEN** a session is paused and the user presses `F`
- **THEN** Home is shown with the cursor in "What are you working on?"

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

### Requirement: Leave a field with Esc
`Esc` in a text field, text area or dropdown that is not inside a dialog or sheet SHALL take the cursor out of the field, so that the shortcuts work again. A field that uses `Esc` itself (closing its suggestions) SHALL do that first; in a dialog or sheet `Esc` SHALL close it as before.

#### Scenario: Leave the focus field
- **WHEN** the cursor is in the focus field without suggestions shown and the user presses `Esc` and then `Shift+P`
- **THEN** the field loses the cursor and Plan is shown

#### Scenario: Suggestions first
- **WHEN** suggestions are shown under the focus field and the user presses `Esc` twice
- **THEN** the first `Esc` closes the suggestions and the second takes the cursor out of the field

#### Scenario: In a sheet
- **WHEN** the cursor is in the title of the New task sheet and the user presses `Esc`
- **THEN** the sheet closes

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
On Home, `J` or the down arrow SHALL highlight the next To do task and `K` or the up arrow the previous one, wrapping from the last task to the first and from the first to the last (the first task when none or a habit is highlighted). The left and right arrows SHALL highlight the previous and next habit due today (the first one when none is highlighted). `1`–`9` SHALL highlight the 1st–9th To do task and `Shift+1`–`Shift+9` the 1st–9th habit, by the digit key whatever character the keyboard layout gives; a number without a task or habit does nothing. For a highlighted task, `Space` SHALL start a focus session, `X` SHALL complete it (as its checkbox does, with Undo) and `Enter` SHALL open it in the task popup (see tasks, "Task popup"); for a highlighted habit, `Space` SHALL start a focus session and `X` or `Enter` SHALL check or uncheck it. The highlight SHALL be visible, scroll into view and clear when the mouse clicks elsewhere.

#### Scenario: Move and start
- **WHEN** the To do list is "Email supervisor", "Rerun benchmarks" and the user presses `J`, `J` and `Space`
- **THEN** a focus session for "Rerun benchmarks" starts and focus mode opens

#### Scenario: Complete highlighted
- **WHEN** "Email supervisor" is highlighted and the user presses `X`
- **THEN** "Email supervisor" is completed and "Task completed" with Undo is shown

#### Scenario: Open highlighted
- **WHEN** "Rerun benchmarks" is highlighted and the user presses `Enter`
- **THEN** its task popup opens over Home

#### Scenario: Highlight by number
- **WHEN** the To do list has three tasks and the user presses `3`
- **THEN** the third task is highlighted and no session starts

#### Scenario: Number beyond the list
- **WHEN** the To do list has two tasks and the user presses `5`
- **THEN** nothing happens

#### Scenario: Up from the first task
- **WHEN** the To do list has four tasks, the first is highlighted and the user presses the up arrow
- **THEN** the fourth task is highlighted

#### Scenario: Habit by number
- **WHEN** the habits due today are "Stretch", "Run 5 km" and the user presses `Shift+2`
- **THEN** "Run 5 km" is highlighted

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

### Requirement: Esc goes back on detail pages
On a project, goal or task page, `Esc` SHALL go back to the screen the page was opened from. When the page was opened directly by its address, `Esc` SHALL open the screen it belongs to (Plan). `Esc` SHALL NOT go back while a field has the focus (it leaves the field first, see "Leave a field with Esc") or while a popup, sheet or dialog is open (it closes that).

#### Scenario: Back to Home
- **WHEN** the user opened the project "Portfolio site" from Home and presses `Esc`
- **THEN** Home is shown again

#### Scenario: Popup first
- **WHEN** the task popup is open over a project page and the user presses `Esc` twice
- **THEN** the first `Esc` closes the popup and the second goes back from the project page

#### Scenario: Opened by address
- **WHEN** the user opened `/projects/<id>` directly and presses `Esc`
- **THEN** Plan is shown

### Requirement: Session keys on Home
On Home, while a session exists, `P` SHALL pause it when it runs, `R` SHALL resume it when it is paused and `C` SHALL open its Complete dialog (see work-timer, "Complete a session"), whether it runs or is paused. Without a session, `P`, `R` and `C` SHALL do nothing; `P` SHALL do nothing while the session is paused and `R` while it runs. Like the other shortcuts they SHALL NOT fire while typing in a field or while a dialog is open, and SHALL be listed in the shortcut overlay.

#### Scenario: Pause with P
- **WHEN** a session for "Thesis" runs and the user presses `P` on Home
- **THEN** the session is paused and the field to start something else is shown

#### Scenario: Resume with R
- **WHEN** a session for "Thesis" is paused and the user presses `R` on Home
- **THEN** the session runs again

#### Scenario: Complete with C
- **WHEN** a session for "Thesis" is paused and the user presses `C` on Home
- **THEN** the Complete dialog for "Thesis" opens

#### Scenario: No session
- **WHEN** no session exists and the user presses `P`, `R` or `C` on Home
- **THEN** nothing happens
