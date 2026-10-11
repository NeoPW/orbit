# visual-design Specification

## Purpose

Defines how the app looks and moves: a calm, space-inspired visual identity shared by every screen, structure through chips and badges instead of text lines, meaningful empty states and motion, and a side-by-side layout on wide screens.

## Requirements

### Requirement: Orbit palette
The app SHALL use its own color palette instead of a default seed: deep navy "night sky" surfaces, a blue-violet primary color, a cyan secondary color and an amber color reserved for urgency. The app SHALL be dark only and ignore the system's light mode. Area colors SHALL be used as accents on cards and chips. Body text SHALL meet a 4.5:1 contrast ratio.

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
Body text SHALL use the bundled Inter typeface and headings (page titles and large headlines) the bundled Space Grotesk typeface, on Android and in the browser, also offline. Titles SHALL be visually stronger than body text, and secondary information SHALL be smaller and muted.

#### Scenario: Offline font
- **WHEN** the app starts without network
- **THEN** body text is rendered in Inter and headings in Space Grotesk

### Requirement: Structure instead of text lines
Metadata SHALL be shown as chips, icons and badges rather than sentences: status as a colored chip, importance as filled dots out of five, deadlines as a badge colored by urgency (amber when due within the lead time, red when overdue), area as a colored chip. Values that are not set SHALL be left out instead of being written out (no "No area", "No deadline", "No goal").

#### Scenario: Project without area and deadline
- **WHEN** a project has no area and no deadline
- **THEN** its card shows neither an area chip nor a deadline badge and no placeholder text

#### Scenario: Importance
- **WHEN** a project has importance 3
- **THEN** it shows three of five dots filled instead of the text "Importance 3"

#### Scenario: Overdue badge
- **WHEN** an item's deadline has passed
- **THEN** its deadline badge is red and reads "Overdue"

### Requirement: Progress as orbit rings
Habits done today and the weekly review's summaries SHALL be shown as slim circular "orbit" rings: a faint track and a rounded arc, without an end marker. A measure's progress SHALL be shown as a slim bar in its goal's color with the percentage next to it.

#### Scenario: Habits done today
- **WHEN** 2 of 4 habits due today are checked
- **THEN** the Home header shows a half-filled orbit ring with "2/4"

#### Scenario: Measure ring color
- **WHEN** the goal "Get fit" is rose
- **THEN** the progress bars of its measures are rose

### Requirement: Empty states
A list or section without content SHALL show an icon, one short line of text and, where it makes sense, the action that fills it.

#### Scenario: No tasks on Home
- **WHEN** there are no open tasks outside projects
- **THEN** the Tasks section shows an icon, a short line and a "New task" action

### Requirement: Motion
Items added to or removed from lists (for example a checked habit, a completed task, a project moving after a status change) SHALL animate in and out instead of jumping. Detail pages SHALL open with a short transition. Animations SHALL be short (at most 300 ms) and SHALL be skipped when the system asks to reduce motion.

#### Scenario: Completing a task
- **WHEN** the user completes a task in a list
- **THEN** the task fades and collapses out of the list

#### Scenario: Reduced motion
- **WHEN** the system setting to remove animations is on
- **THEN** lists and pages change without animation

### Requirement: Two panes on wide screens
At a window width of 1000 logical pixels or more, the Plan tab SHALL show its list on the left and the selected goal, project or task on the right, instead of opening them as a separate page. At smaller widths they SHALL open as pages.

#### Scenario: Desktop browser
- **WHEN** the window is 1400 pixels wide and the user taps a project in the Plan tab
- **THEN** the project detail is shown to the right of the list and the list stays visible

#### Scenario: Phone
- **WHEN** the window is 400 pixels wide and the user taps a project
- **THEN** the project detail opens as its own page

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
Forms to create or edit goals, measures, projects, tasks, habits and areas SHALL open in a sheet over the current screen: a bottom sheet at phone width and a side sheet at 1000 pixels or more. A sheet SHALL show the form's title, Save, Delete when editing, and scroll when the form is longer than the screen. Closing a sheet without saving SHALL discard the changes.

#### Scenario: Phone
- **WHEN** the window is 400 pixels wide and the user creates a project
- **THEN** the project form opens as a bottom sheet over the Plan tab and the URL does not change

#### Scenario: Wide screen
- **WHEN** the window is 1400 pixels wide and the user edits a goal
- **THEN** the goal form opens as a side sheet on the right

#### Scenario: Discard by closing
- **WHEN** the user changes a project's title in its sheet and closes the sheet without saving
- **THEN** the project keeps its old title

### Requirement: Space background
Behind every screen the app SHALL show a Hubble photo bundled with the app, under a dark gradient so text stays readable. The photo SHALL change once a day (the same photo on every screen that day) unless one is pinned in Settings (see settings). Without the photo, the night-sky color SHALL be shown.

#### Scenario: Same photo all day
- **WHEN** the user moves between Plan, Home and Review on one day
- **THEN** every screen shows the same photo

#### Scenario: Next day
- **WHEN** the date changes and no photo is pinned
- **THEN** the screens show the next photo of the collection

#### Scenario: Offline
- **WHEN** the app starts without network
- **THEN** the photo is shown, since it is bundled

### Requirement: Translucent surfaces
Cards, top bars and the navigation SHALL be slightly translucent so the background photo shows through. Sheets and dialogs SHALL be opaque, so the screen behind them cannot be read through them.

#### Scenario: Card on the photo
- **WHEN** a project card is shown on Home
- **THEN** the background photo is faintly visible through the card

#### Scenario: Opaque sheet
- **WHEN** the quick log sheet is open over Home
- **THEN** no text of Home shows through the sheet

### Requirement: App icon and launch screen
The app icon SHALL be a glowing planet with a ringed orbit and a cyan moon on a starry night sky, also as an Android adaptive icon and as web icons. The Android launch screen and the web loading screen SHALL show the night sky with that planet instead of a white screen.

#### Scenario: Android start
- **WHEN** the app is started on Android
- **THEN** the launch screen is dark with the planet, not white

#### Scenario: Web loading
- **WHEN** the web app is loading
- **THEN** the page shows the night sky and the planet until the app is drawn

### Requirement: Sheets clear of the system and tab bars
Bottom sheets SHALL open above the tab bar, covering it, and SHALL keep their content clear of the phone's system navigation bar and of the on-screen keyboard.

#### Scenario: Quick log on Home
- **WHEN** the user opens quick log on Home on a phone with a navigation bar
- **THEN** the sheet covers the tab bar and its last row is fully visible above the navigation bar

#### Scenario: Last field of a form
- **WHEN** the user scrolls to the end of the goal form in a bottom sheet
- **THEN** the status buttons are fully visible above the navigation bar
