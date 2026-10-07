# Spec Delta

## ADDED Requirements

### Requirement: Messages at the top
Short confirmations (for example "Task completed", "Work logged", "Task created") SHALL appear at the top of the screen, below the status bar, as a compact card with an icon and one line of text. A message SHALL disappear on its own after 3 seconds and SHALL be dismissible by swiping it away. An action such as Undo or Open SHALL be part of the card while it is shown. A new message SHALL replace the one shown.

#### Scenario: Position
- **WHEN** the user completes a task on Home
- **THEN** "Task completed" with Undo appears at the top of the screen, not over the floating buttons

#### Scenario: Auto dismiss
- **WHEN** a message has been shown for 3 seconds
- **THEN** it is gone

#### Scenario: Swipe away
- **WHEN** the user swipes a message up
- **THEN** it disappears at once

#### Scenario: Survives closing a sheet
- **WHEN** saving in a sheet closes it and shows "Task created"
- **THEN** the message is shown over the screen below the closed sheet

### Requirement: Forms in sheets
Forms to create or edit objectives, key results, projects, tasks, habits and areas SHALL open in a sheet over the current screen: a bottom sheet at phone width and a side sheet at 1000 pixels or more. A sheet SHALL show the form's title, Save, Delete when editing, and scroll when the form is longer than the screen. Closing a sheet without saving SHALL discard the changes.

#### Scenario: Phone
- **WHEN** the window is 400 pixels wide and the user creates a project
- **THEN** the project form opens as a bottom sheet over the Plan tab and the URL does not change

#### Scenario: Wide screen
- **WHEN** the window is 1400 pixels wide and the user edits an objective
- **THEN** the objective form opens as a side sheet on the right

#### Scenario: Discard by closing
- **WHEN** the user changes a project's title in its sheet and closes the sheet without saving
- **THEN** the project keeps its old title

## MODIFIED Requirements

### Requirement: Two panes on wide screens
At a window width of 1000 logical pixels or more, the Plan tab SHALL show its list on the left and the selected objective, KR, project or task on the right, instead of opening them as a separate page. At smaller widths they SHALL open as pages.

#### Scenario: Desktop browser
- **WHEN** the window is 1400 pixels wide and the user taps a project in the Plan tab
- **THEN** the project detail is shown to the right of the list and the list stays visible

#### Scenario: Phone
- **WHEN** the window is 400 pixels wide and the user taps a project
- **THEN** the project detail opens as its own page
