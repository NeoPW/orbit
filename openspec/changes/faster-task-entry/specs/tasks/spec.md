# Spec Delta

## ADDED Requirements

### Requirement: Project suggestions in the new task title
When the user creates a task, typing `#` in the title SHALL suggest the active projects whose name contains the text after the last `#` (all active projects while nothing follows it), with their colours, as the focus panel does. Picking one by click, tap, or the arrow keys and Enter or Tab SHALL set "Assigned to" to that project and leave only the text before `#` in the title. Editing an existing task SHALL NOT suggest projects.

#### Scenario: Suggest projects
- **WHEN** the user types "Draft intro # port" in the title of a new task and "Portfolio site" is active
- **THEN** "Portfolio site" is suggested with its colour

#### Scenario: Pick a project
- **WHEN** the user picks "Portfolio site" from the suggestions for "Draft intro # port"
- **THEN** the title reads "Draft intro" and "Assigned to" shows "Portfolio site"

#### Scenario: Editing keeps the #
- **WHEN** the user edits the task "Fix issue" and types "Fix issue #12" as its title and saves
- **THEN** no project is suggested and the task is titled "Fix issue #12"

### Requirement: Project typed in the new task title
Saving a new task whose title contains `#` SHALL save the text before the last `#` as the title and assign the project that the text after it names: the active project with that name (ignoring case), else the only active project starting with it. This SHALL replace the choice in "Assigned to". When no project matches, the form SHALL show "No project named …" under the title and save nothing.

#### Scenario: Unique prefix
- **WHEN** the user types "Draft intro # chap" in a new task, "Chapter 4: Evaluation" is the only active project starting with "chap", and presses Enter
- **THEN** the task "Draft intro" is created in "Chapter 4: Evaluation"

#### Scenario: Unknown project
- **WHEN** the user types "Draft intro # garden" in a new task, no active project matches "garden", and saves
- **THEN** the form shows "No project named garden" and no task is created

#### Scenario: Overrides the preselected project
- **WHEN** the user adds a task in the detail of "Thesis" and types "Update CV # portfolio site" and saves
- **THEN** the task "Update CV" belongs to "Portfolio site"

### Requirement: Next-step prompt from the keyboard
When the project has other open tasks, the next-step prompt SHALL open with the first of them highlighted, in the project's task order; otherwise the cursor SHALL be in the new-task field. The up and down arrows SHALL move the highlight through the tasks, and up from the first task into the new-task field and down from it back to the first task. Typing a character while a task is highlighted SHALL put it into the new-task field.

#### Scenario: Highlight on open
- **WHEN** the user completes the last next step of a project with the open tasks "Book venue" and "Send invites"
- **THEN** the prompt opens with "Book venue" highlighted

#### Scenario: Move down
- **WHEN** "Book venue" is highlighted and the user presses the down arrow
- **THEN** "Send invites" is highlighted

#### Scenario: Type a new task
- **WHEN** a task is highlighted and the user types "Write intro" and presses Enter
- **THEN** "Write intro" is created as the next step and the old next step is done

#### Scenario: No other tasks
- **WHEN** the user completes the last open task of a project, which was its last next step
- **THEN** the prompt opens with the cursor in the new-task field

### Requirement: Pick a next step with one click
In the next-step prompt, Enter on the highlighted task or a click (tap) on a task SHALL pick it, together with the tasks already selected, and complete the old next step at once. Ctrl+Enter on the highlighted task, Ctrl+click on a task or its checkbox SHALL add it to the selection or remove it, without completing. Complete SHALL pick the selected tasks.

#### Scenario: Enter picks
- **WHEN** "Send invites" is highlighted in the prompt and the user presses Enter
- **THEN** the old next step is done, "Send invites" is the next step and the prompt is closed

#### Scenario: Click picks
- **WHEN** the user clicks "Book venue" in the prompt
- **THEN** the old next step is done and "Book venue" is the next step

#### Scenario: Select several
- **WHEN** the user presses Ctrl+Enter on "Book venue", moves down and presses Enter on "Send invites"
- **THEN** the old next step is done and both "Book venue" and "Send invites" are next steps

#### Scenario: Ctrl+click does not complete
- **WHEN** the user Ctrl+clicks "Book venue" in the prompt
- **THEN** "Book venue" is selected, the prompt stays open and the old next step is still open
