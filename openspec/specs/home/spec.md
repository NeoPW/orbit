# home Specification

## Purpose

Defines the Home tab, the daily view of the app: the habits due today, upcoming deadlines, the active projects in order of deadline with their next steps, and the entry point for logging work.

## Requirements

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

### Requirement: Habits due today on Home
The "Habits due today" section SHALL show every active habit that is due today (see habits) or already checked today as a chip with its title, labeled with the title of its linked project, or of its goal when it has no project, and visibly marked when checked today. Tapping a chip SHALL check or uncheck the habit for today.

#### Scenario: Habit labeled by project
- **WHEN** an active daily habit "Stretch" is linked to project "Marathon"
- **THEN** Home shows an unchecked chip "Stretch" labeled "Marathon"

#### Scenario: Habit labeled by goal
- **WHEN** an active daily habit "Read" is linked only to the goal "Learn Spanish"
- **THEN** Home shows a chip "Read" labeled "Learn Spanish"

#### Scenario: Checked habit stays listed
- **WHEN** a habit with 3 times per week has 2 earlier check-ins this week and the user checks it today
- **THEN** it stays on Home, shown as checked

#### Scenario: Check from Home
- **WHEN** the user taps the chip of an unchecked habit
- **THEN** the habit is shown as checked and a log entry for it exists

### Requirement: Active project entries
Each active project in the side column SHALL show its title, its area color, its deadline badge (see visual-design, "Deadline badge text"; marked when inherited from the goal) and at most 3 of its open tasks as checkbox rows, in the project's open task order (next steps first; see tasks, "Reorder open tasks"). When the project has more open tasks, the card SHALL show a "+N more" link with the number of tasks not shown, which opens the project detail. Values that are not set SHALL be left out.

#### Scenario: Badge in days
- **WHEN** the lead time is 7 days, today is 2026-10-05 and a project's effective deadline is 2026-10-08
- **THEN** it shows "In 3 days"

#### Scenario: Next steps first
- **WHEN** an active project has the next step "Draft outline" and the other open tasks "Book venue" and "Send invites", in that order
- **THEN** its card lists "Draft outline", "Book venue" and "Send invites" and no "+N more" link

#### Scenario: More than three tasks
- **WHEN** an active project has 5 open tasks
- **THEN** its card lists the first 3 and a "+2 more" link

#### Scenario: Open the project from "+N more"
- **WHEN** the user clicks "+2 more" on a project card
- **THEN** the project detail opens

#### Scenario: No next steps
- **WHEN** an active project has no open next step and the open task "Book venue"
- **THEN** its card lists "Book venue"

#### Scenario: No open tasks
- **WHEN** an active project has no open task
- **THEN** it is listed with its title and badges and no task rows

### Requirement: Act on a project card
Ticking the checkbox of a task in the side column SHALL complete that task, with Undo; for the project's last next step the prompt for a new next step SHALL follow (see tasks, "Prompt after the last next step"). Clicking the project elsewhere SHALL open the project detail.

#### Scenario: Complete next step from Home
- **WHEN** the user ticks the only next step "Draft outline" of a project without other open tasks and chooses to skip a new next step
- **THEN** the task is done and the project is listed without task rows

#### Scenario: Complete another task from Home
- **WHEN** the user ticks "Book venue", which is not a next step, on a project card
- **THEN** the task is done, no next-step prompt is shown and the card lists the project's next open task in its place, if any

#### Scenario: Open detail
- **WHEN** the user clicks a project in the side column outside its task rows
- **THEN** the project detail opens

### Requirement: Today follows the calendar
Home SHALL use the device's local date for "today". When the date changes while the app is open, or when the app returns to the foreground on a later date, Home SHALL recompute the date, due habits and deadline badges for the new date.

#### Scenario: New day
- **WHEN** a daily habit was checked yesterday and the app is brought back to the foreground today
- **THEN** the habit is listed unchecked

### Requirement: Home updates live
Home SHALL update immediately after any change to habits, habit checks, tasks, projects, goals or measures, without a manual refresh.

#### Scenario: Project activated elsewhere
- **WHEN** the user activates a backlog project in the Plan tab and switches to Home
- **THEN** the project is listed under active projects

### Requirement: To do on Home
"To do" SHALL list the open next-step tasks of active projects and the open tasks outside projects (standalone or assigned to a goal), in To do order (see "To do order"). Each row SHALL show a drag handle, a checkbox that completes the task (with Undo), the title, its project or goal, a deadline badge and an action to start a focus session. Clicking the row elsewhere SHALL open the task page.

#### Scenario: Next steps and loose tasks
- **WHEN** an active project has the next step "Draft outline" and the open task "Send invites", and the standalone task "Tax return" is open
- **THEN** To do lists "Draft outline" and "Tax return", but not "Send invites"

#### Scenario: Paused project
- **WHEN** a paused project has an open next step
- **THEN** it is not listed in To do

#### Scenario: Task of a goal
- **WHEN** the open task "Book physio" is assigned to the goal "Get fit"
- **THEN** To do lists it with "Get fit"

### Requirement: Create a task from Home
Home's "New task" SHALL open a sheet to create a task with a title, an optional deadline and an optional assignment (an active project or an active goal). A project can also be named in the title with `#` (see tasks, "Project suggestions in the new task title"). Typing a title and pressing Enter SHALL create a standalone task.

#### Scenario: Title and Enter
- **WHEN** the user clicks "New task", types "Tax return" and presses Enter
- **THEN** an open standalone task "Tax return" exists and is listed in To do

#### Scenario: Assign to a goal
- **WHEN** the user creates the task "Book physio" assigned to the goal "Get fit"
- **THEN** the task belongs to "Get fit" and is listed in To do

#### Scenario: Project in the title
- **WHEN** the user clicks "New task", types "Rerun benchmarks # Chapter 4" and presses Enter
- **THEN** the task "Rerun benchmarks" exists in "Chapter 4: Evaluation"

### Requirement: Done today on Home
"Done today" SHALL list the tasks completed today (local day), most recently completed first, each with a checked checkbox, its title, its project chip (or goal) and the time it was completed. Unchecking SHALL reopen the task (see tasks, "Reopen task"); clicking the row SHALL open the task page. The list SHALL update live and move to the new day at midnight.

#### Scenario: Completed task
- **WHEN** the user completes "Email supervisor" at 11:20
- **THEN** it leaves "To do" and appears at the top of "Done today" with "11:20"

#### Scenario: Reopen
- **WHEN** the user unchecks "Email supervisor" in "Done today"
- **THEN** the task is open again, leaves "Done today" and is back in "To do"

#### Scenario: Yesterday
- **WHEN** a task was completed yesterday
- **THEN** it is not in "Done today"

### Requirement: Start focus from a habit
Each chip in "Habits due today" SHALL have a small start button beside its check area that starts a focus session on the habit (see work-timer). Clicking the chip itself SHALL still check or uncheck the habit.

#### Scenario: Start from a chip
- **WHEN** the user uses the start button on the chip "Run 5 km"
- **THEN** a focus session for "Run 5 km" starts and the habit's checked state is unchanged

#### Scenario: Chip still checks
- **WHEN** the user clicks the chip "Run 5 km" itself
- **THEN** the habit is checked and no session starts

### Requirement: Open tasks on Home
Clicking a task in To do, in Done today or among the next steps of a project card on Home SHALL open it in the task popup (see tasks, "Task popup"). Home SHALL stay selected behind it.

#### Scenario: Open from To do
- **WHEN** the user clicks "Rerun benchmarks" in To do
- **THEN** the popup of "Rerun benchmarks" opens over Home and the Home tab stays selected

#### Scenario: From a project card
- **WHEN** the user clicks the next step "Case study copy" in the card of "Portfolio site"
- **THEN** the popup of "Case study copy" opens

#### Scenario: Complete moves it to Done today
- **WHEN** the user completes a task in its popup on Home
- **THEN** the task moves from To do to Done today behind the popup

### Requirement: More tasks in To do
Directly below the To do list, Home SHALL show a toggle with a down chevron and N, the number of open tasks of active projects that are not next steps (named "Show N more" for screen readers and in its tooltip). Using it SHALL list those tasks below the toggle, grouped by project in the side column's project order and, within a project, in the project's open task order (see tasks, "Open task order"), with the same rows and actions as To do except the drag handle; the toggle SHALL stay in its place, show an up chevron and N (named "Show less") and hide them again. It SHALL start collapsed when Home opens and be hidden when there are no such tasks. While expanded, its tasks SHALL count as To do tasks for the To do list keys (see keyboard-shortcuts), after the others.

#### Scenario: Expand
- **WHEN** an active project has the next step "Draft outline" and the open task "Send invites", and the user uses the toggle showing 1
- **THEN** "Send invites" is listed below the toggle, which is below "Draft outline", with a checkbox, its project and a start action, and the toggle shows an up chevron

#### Scenario: Order of the expanded tasks
- **WHEN** project P is listed before project Q in the side column, P's other open tasks are "B", "A" in its task order and Q has the other open task "C"
- **THEN** the expanded tasks read "B", "A", "C"

#### Scenario: Collapsed at start
- **WHEN** Home opens and active projects have open tasks that are not next steps
- **THEN** those tasks are not listed and the toggle shows a down chevron and their number

#### Scenario: Nothing more
- **WHEN** every open task of the active projects is a next step
- **THEN** no toggle is shown

#### Scenario: Paused project stays hidden
- **WHEN** a paused project has an open task that is not a next step
- **THEN** it is not counted by the toggle and not listed when expanded

#### Scenario: Keys reach the expanded tasks
- **WHEN** To do lists two tasks, the section is expanded with one more task and the user presses `3`
- **THEN** the expanded task is highlighted

### Requirement: Today's note on Home
"Today's note" SHALL hold the daily note of the current day (see daily-notes), shown formatted or as a multi-line text field as daily-notes describes, and empty when the day has none. When the date changes while Home is open, or Home is shown again on a later date, the field SHALL show the new day's note after saving what was typed.

#### Scenario: Note shown again
- **WHEN** today has the note "Call the bank" and the user opens Home
- **THEN** "Today's note" shows "Call the bank"

#### Scenario: New day
- **WHEN** the user typed "Call the bank" on 2026-11-09 and Home is shown again on 2026-11-10
- **THEN** "Today's note" is empty and the note of 2026-11-09 is "Call the bank"

### Requirement: Active projects ordered by deadline
Home's side column SHALL list all projects with status `active`, ordered by effective deadline (earliest first, none last), then by time added (oldest first).

#### Scenario: Deadline first
- **WHEN** project A has no deadline and project B has an effective deadline next month
- **THEN** B is listed before A

#### Scenario: Tie broken by time added
- **WHEN** projects A and B have no effective deadline and A was added before B
- **THEN** A is listed before B

### Requirement: To do order
To do SHALL be listed in its own order, independent of the projects' task order. Until the user reorders To do, its tasks SHALL be listed by time added (oldest first). After a reorder, tasks with a Home position SHALL come first, by position, and the others after them, by time added. Once To do has a manual order, marking a task as a next step SHALL put it at the end. Due dates SHALL NOT change the order.

#### Scenario: Time added
- **WHEN** To do has never been reordered and "Tax return" was added before the next step "Draft outline", which is due tomorrow
- **THEN** To do lists "Tax return" before "Draft outline"

#### Scenario: New task goes to the end
- **WHEN** To do was reordered to "Draft outline", "Tax return" and the user adds the standalone task "Call the bank"
- **THEN** To do reads "Draft outline", "Tax return", "Call the bank"

#### Scenario: New next step goes to the end
- **WHEN** To do has a manual order and the user marks the older task "Send invites" as a next step of an active project
- **THEN** "Send invites" is listed last in To do

#### Scenario: Independent of the project order
- **WHEN** the user moves "Book venue" above "Write intro" in their project, and both are next steps listed in To do as "Write intro", "Book venue"
- **THEN** To do still lists "Write intro" before "Book venue"

### Requirement: Reorder To do
The user SHALL be able to move a task of To do to another place in To do by dragging its handle or, with the handle focused, with `Alt+↑` and `Alt+↓`. The new order SHALL be kept, shown at once and synced with the other devices. The tasks behind "Show N more" SHALL NOT be reorderable on Home.

#### Scenario: Drag a task up
- **WHEN** To do lists A, B and C and the user drags C above A
- **THEN** To do reads C, A, B and stays so after a reload

#### Scenario: Keyboard
- **WHEN** the handle of B is focused and the user presses `Alt+↑`
- **THEN** B moves one place up and keeps the focus

#### Scenario: Synced
- **WHEN** the user reorders To do on the desktop and the phone syncs
- **THEN** the phone's To do shows the same order
