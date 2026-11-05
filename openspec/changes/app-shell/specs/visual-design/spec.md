# Spec Delta

## MODIFIED Requirements

### Requirement: Orbit palette
The app SHALL use its own color palette: deep navy "night sky" surfaces, a blue-violet primary color, a cyan secondary color, an amber color reserved for urgency and a red color for overdue. The app SHALL be dark only and ignore the system's light mode. Area colors SHALL be used as accents on cards and chips. Body text SHALL meet a 4.5:1 contrast ratio.

#### Scenario: Dark mode surfaces
- **WHEN** the app is shown
- **THEN** screens use the navy color of the palette, not a neutral grey

#### Scenario: System in light mode
- **WHEN** the operating system or browser is set to light mode
- **THEN** the app still uses its dark look

#### Scenario: Area accent
- **WHEN** a project belongs to the area "Job" with color blue
- **THEN** its card shows a blue accent

### Requirement: Typography
Body text SHALL use the bundled Inter typeface and headings (page titles and large headlines) the bundled Space Grotesk typeface, in the desktop app and in the browser, also offline. Titles SHALL be visually stronger than body text, and secondary information SHALL be smaller and muted.

#### Scenario: Offline font
- **WHEN** the app starts without network
- **THEN** body text is rendered in Inter and headings in Space Grotesk

### Requirement: Forms in sheets
Forms to create or edit goals, measures, projects, tasks, habits and areas SHALL open in an opaque side sheet on the right, over the current screen, covering the full window width when the window is narrower than 600 pixels; the screen behind it SHALL NOT be usable while it is open. A sheet SHALL show the form's title, Save, Delete when editing, and scroll when the form is longer than the window. Enter in a single-line field SHALL save. Escape or closing the sheet without saving SHALL discard the changes.

#### Scenario: Wide screen
- **WHEN** the window is 1400 pixels wide and the user edits a goal
- **THEN** the goal form opens as a side sheet on the right and the URL does not change

#### Scenario: Phone
- **WHEN** the browser window is 400 pixels wide and the user creates a project
- **THEN** the project form opens as a sheet over the full window width and the URL does not change

#### Scenario: Enter saves
- **WHEN** the user types a title in the sheet's title field and presses Enter
- **THEN** the form is saved and the sheet closes

#### Scenario: Escape discards
- **WHEN** the user changes a project's title in its sheet and presses Escape
- **THEN** the sheet closes and the project keeps its old title

#### Scenario: Discard by closing
- **WHEN** the user changes a project's title in its sheet and closes the sheet without saving
- **THEN** the project keeps its old title

## ADDED Requirements

### Requirement: Message cards
Short confirmations (for example "Task completed", "Work logged") SHALL appear at the top of the window, centered over the screen, as a compact card with an icon, one line of text and a close button, announced to screen readers. A message SHALL disappear on its own after 3 seconds, but not while the pointer is over it or it has keyboard focus. An action such as Undo SHALL be part of the card; choosing it SHALL run it and close the message. A new message SHALL replace the one shown.

#### Scenario: Position
- **WHEN** the user completes a task on Home
- **THEN** "Task completed" with Undo appears at the top of the window

#### Scenario: Auto dismiss
- **WHEN** a message has been shown for 3 seconds without the pointer over it
- **THEN** it is gone

#### Scenario: Pointer over the message
- **WHEN** the pointer rests on a message for 5 seconds and then leaves it
- **THEN** the message stays while the pointer is on it and disappears 3 seconds after it leaves

#### Scenario: Close
- **WHEN** the user clicks the message's close button
- **THEN** it disappears at once

#### Scenario: Action
- **WHEN** the user clicks Undo on "Task completed"
- **THEN** the undo runs and the message disappears

#### Scenario: Replaced
- **WHEN** a message is shown and another one is triggered
- **THEN** only the new message is shown, for a full 3 seconds

#### Scenario: Survives closing a sheet
- **WHEN** saving in a sheet closes it and shows "Task created"
- **THEN** the message is shown over the screen below the closed sheet

### Requirement: App icon and loading screen
The app icon SHALL be a glowing planet with a ringed orbit and a cyan moon on a starry night sky, as the desktop app icon and as the web icon. While the app loads, the desktop window and the browser page SHALL show the night sky with that planet instead of a white screen.

#### Scenario: Desktop start
- **WHEN** the desktop app is started
- **THEN** the window is dark with the planet until the app is drawn, not white

#### Scenario: Web loading
- **WHEN** the web app is loading
- **THEN** the page shows the night sky and the planet until the app is drawn

### Requirement: Deadline badge text
A deadline badge SHALL count local calendar days from today to the deadline. It SHALL read "Overdue" in red after the deadline, "Today" on the day itself, "Tomorrow" one day before, and "In N days" when the deadline is within the deadline lead time, in amber. A deadline further away SHALL show its date as `dd-mm-yyyy` without an urgency color.

#### Scenario: Overdue
- **WHEN** the deadline was yesterday
- **THEN** the badge is red and reads "Overdue"

#### Scenario: Today
- **WHEN** the deadline is today
- **THEN** the badge is amber and reads "Today"

#### Scenario: Within the lead time
- **WHEN** the lead time is 7 days and the deadline is 5 days ahead
- **THEN** the badge is amber and reads "In 5 days"

#### Scenario: Beyond the lead time
- **WHEN** the lead time is 7 days and the deadline is 31-12-2026, 40 days ahead
- **THEN** the badge reads "31-12-2026" without urgency color

### Requirement: Visible keyboard focus
Every interactive element SHALL show a clearly visible focus indicator when it is reached with the keyboard, and none when it is clicked with the pointer.

#### Scenario: Tab through the sidebar
- **WHEN** the user presses Tab until a sidebar entry has focus
- **THEN** that entry shows a focus ring

#### Scenario: Click
- **WHEN** the user clicks a button
- **THEN** no focus ring is shown on it

## REMOVED Requirements

### Requirement: Messages at the top
**Reason**: Swiping a message away is a touch gesture; on the desktop messages get a close button and pause while the pointer is on them.
**Migration**: Replaced by "Message cards".

### Requirement: App icon and launch screen
**Reason**: The Android adaptive icon and launch screen are not part of the rebuilt app.
**Migration**: Replaced by "App icon and loading screen"; the Android companion gets its own requirements.

### Requirement: Sheets clear of the system and tab bars
**Reason**: The rebuilt app targets the desktop and the browser; it has no bottom tab bar, phone navigation bar or bottom sheets.
**Migration**: None; the Android companion gets its own requirements when it is built.
