## MODIFIED Requirements

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

## ADDED Requirements

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

