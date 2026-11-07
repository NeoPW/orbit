# Spec Delta

## Purpose

A searchable command palette (`Ctrl+K`) that reaches every common action, screen and item by typing: create, go to, start focus, control the running session, switch the theme and sync.

## ADDED Requirements

### Requirement: Open and use the palette
`Ctrl+K` SHALL open the palette over the current screen with an empty search field and the cursor in it. Typing SHALL filter the entries to those whose name contains every typed word (ignoring case), at most 50 shown. Arrow keys SHALL move the highlight, `Enter` or a click SHALL run the highlighted entry and close the palette, and `Esc` SHALL close it without running anything. Each entry SHALL show its kind (Create, Go to, Focus, Session, Theme, Sync) and its shortcut if it has one.

#### Scenario: Filter
- **WHEN** the user opens the palette and types "new pro"
- **THEN** "New project" is shown and "New task" is not

#### Scenario: Run with Enter
- **WHEN** the user types "log" and presses `Enter`
- **THEN** the Log work sheet opens and the palette is closed

#### Scenario: Shortcut shown
- **WHEN** the palette shows "New task"
- **THEN** the entry shows `T`

#### Scenario: Close
- **WHEN** the user presses `Esc` in the palette
- **THEN** the palette closes and nothing else happens

### Requirement: Create entries
The palette SHALL offer "New task", "New project", "New goal", "New habit", "New area" and "Log work", each opening its form as a sheet over the current screen.

#### Scenario: New goal from Home
- **WHEN** the user runs "New goal" on Home
- **THEN** the goal form opens over Home

### Requirement: Go to entries
The palette SHALL offer Home, Plan, Review and Settings, and every project, goal and open task by its title, each opening its screen or page.

#### Scenario: Go to a project
- **WHEN** the user types "thesis" and runs the project "Thesis"
- **THEN** the project page of "Thesis" opens

### Requirement: Focus entries
The palette SHALL offer "Focus: <title>" for every open task, active habit and active project, starting a focus session on it. For any typed text the palette SHALL also offer, as its last entry, "Focus: <text>", which starts as Home's focus field does with the same text (see work-timer, "Start with a new task"): an existing task or habit of that title, else a new task, with `# project` assigning it.

#### Scenario: Focus on a task
- **WHEN** the user types "bench" and runs "Focus: Rerun benchmarks"
- **THEN** a focus session for "Rerun benchmarks" starts and focus mode opens

#### Scenario: Focus on new text
- **WHEN** the user types "draft intro # thesis" and runs "Focus: draft intro # thesis"
- **THEN** the task "draft intro" is created in "Thesis" and a session for it starts

### Requirement: Session entries
While a session exists, the palette SHALL offer "Pause" or "Resume", "Complete" (opening the complete dialog) and "Set time limit" (offering the limit choices of focus mode); without a session it SHALL not show them.

#### Scenario: Pause from the palette
- **WHEN** a session runs and the user runs "Pause"
- **THEN** the session is paused and its stretch logged

#### Scenario: No session
- **WHEN** no session exists and the user types "pause"
- **THEN** no session entry is shown

### Requirement: Theme and sync entries
The palette SHALL offer "Theme: <name>" for every theme, switching to it, and, when sync is connected, "Sync now".

#### Scenario: Switch theme
- **WHEN** the user runs "Theme: Forest"
- **THEN** the app uses the Forest theme

#### Scenario: Sync not connected
- **WHEN** sync is not connected and the user types "sync"
- **THEN** "Sync now" is not shown
