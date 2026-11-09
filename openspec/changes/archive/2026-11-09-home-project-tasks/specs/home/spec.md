# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: More tasks in To do
Directly below the ranked To do list, Home SHALL show a toggle with a down chevron and N, the number of open tasks of active projects that are not next steps (named "Show N more" for screen readers and in its tooltip). Using it SHALL list those tasks below the toggle, ranked by task rank, with the same rows and actions as To do; the toggle SHALL stay in its place, show an up chevron and N (named "Show less") and hide them again. It SHALL start collapsed when Home opens and be hidden when there are no such tasks. While expanded, its tasks SHALL count as To do tasks for the To do list keys (see keyboard-shortcuts), after the ranked ones.

#### Scenario: Expand
- **WHEN** an active project has the next step "Draft outline" and the open task "Send invites", and the user uses the toggle showing 1
- **THEN** "Send invites" is listed below the toggle, which is below "Draft outline", with a checkbox, its project and a start action, and the toggle shows an up chevron

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
- **WHEN** To do lists two ranked tasks, the section is expanded with one more task and the user presses `3`
- **THEN** the expanded task is highlighted
