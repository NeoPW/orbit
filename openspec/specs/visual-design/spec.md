# visual-design Specification

## Purpose

Defines how the app looks and moves: a calm, space-inspired visual identity shared by every screen, structure through chips and badges instead of text lines, meaningful empty states and motion, and a side-by-side layout on wide screens.

## Requirements

### Requirement: Orbit palette
The app SHALL use its own color palette instead of a default seed: deep navy "night sky" surfaces in dark mode and light lavender-grey surfaces in light mode, a blue-violet primary color, a cyan secondary color and an amber color reserved for urgency. Area colors SHALL be used as accents on cards and chips. Both themes SHALL meet a 4.5:1 contrast ratio for body text.

#### Scenario: Dark mode surfaces
- **WHEN** the app is shown in dark mode
- **THEN** screens use the navy background color of the palette, not a neutral grey

#### Scenario: Area accent
- **WHEN** a project belongs to the area "Job" with color blue
- **THEN** its card shows a blue accent

### Requirement: Typography
All text SHALL use the bundled Inter typeface, on Android and in the browser, also offline. Titles SHALL be visually stronger than body text, and secondary information SHALL be smaller and muted.

#### Scenario: Offline font
- **WHEN** the app starts without network
- **THEN** text is rendered in Inter

### Requirement: Structure instead of text lines
Metadata SHALL be shown as chips, icons and badges rather than sentences: status as a colored chip, importance as filled dots out of five, deadlines as a badge colored by urgency (amber when due within the lead time, red when overdue), area as a colored chip. Values that are not set SHALL be left out instead of being written out (no "No area", "No deadline", "No key result").

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
Progress values (habits done today, KR progress) SHALL be shown as circular "orbit" rings where a summary is shown; KR progress in lists MAY additionally use a bar.

#### Scenario: Habits done today
- **WHEN** 2 of 4 habits due today are checked
- **THEN** the Home header shows a half-filled orbit ring with "2/4"

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
At a window width of 1000 logical pixels or more, the Plan tab SHALL show its list on the left and the selected project or task on the right, instead of opening them as a separate page. At smaller widths they SHALL open as pages.

#### Scenario: Desktop browser
- **WHEN** the window is 1400 pixels wide and the user taps a project in the Plan tab
- **THEN** the project detail is shown to the right of the list and the list stays visible

#### Scenario: Phone
- **WHEN** the window is 400 pixels wide and the user taps a project
- **THEN** the project detail opens as its own page
