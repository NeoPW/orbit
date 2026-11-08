# mobile-layout Specification

## Purpose

Defines how Orbit looks and behaves on a phone: one column with a bottom navigation, touch-sized controls and the screens that exist on the phone (Home, Today, Settings), plus quick add of a task. It applies to the Android app and to any window narrower than 640 pixels.

## Requirements

### Requirement: Phone layout
Below 640 pixels window width the app SHALL show a single column with a bottom navigation of three entries, Home, Today and Settings, the current one marked, instead of the sidebar. Content SHALL stay clear of the system bars and display cutouts (safe areas), and the page SHALL NOT scroll horizontally. At 640 pixels and wider the desktop layout SHALL be used unchanged.

#### Scenario: Narrow window
- **WHEN** the app is shown in a 390 pixel wide window
- **THEN** the bottom navigation with Home, Today and Settings is shown and the sidebar is not

#### Scenario: Wide window
- **WHEN** the app is shown in a 1280 pixel wide window
- **THEN** the sidebar is shown and the bottom navigation is not

#### Scenario: Switch screen
- **WHEN** the user taps "Today" in the bottom navigation
- **THEN** the Today screen opens and "Today" is marked as current

#### Scenario: Focus mode without navigation
- **WHEN** a focus session is open in focus mode on the phone
- **THEN** the bottom navigation is not shown

### Requirement: Touch targets
On the phone, buttons, checkboxes, list rows and the start button of a task SHALL be at least 44 pixels high, and controls that appear only on hover on the desktop SHALL be always visible.

#### Scenario: Start button
- **WHEN** To do is shown on the phone
- **THEN** the start button of each task is visible without hovering and is at least 44 pixels high and wide

### Requirement: Home on the phone
Home on the phone SHALL be one column with, from top to bottom, the date with the quick-add button, the focus panel, "Habits due today", "To do" and "Done today". The Today timeline and the active projects SHALL NOT be on Home on the phone (the timeline has its own screen).

#### Scenario: Home order
- **WHEN** Home is shown on the phone
- **THEN** the focus panel is above "Habits due today", which is above "To do", and the active projects are not shown

#### Scenario: Complete a task
- **WHEN** the user taps the checkbox of a task in To do
- **THEN** the task is completed and appears in "Done today", as on the desktop

### Requirement: Quick add task
The phone SHALL offer a quick-add button on Home that opens the new task form (title, optional due date, importance and assignment) as a full-screen sheet; saving a task with only a title SHALL be possible, and the keyboard's Enter key SHALL save it.

#### Scenario: Add by title
- **WHEN** the user taps the quick-add button, types "Call the bank" and presses Enter
- **THEN** the standalone task "Call the bank" is created and appears in To do

### Requirement: Screens on the phone
The phone SHALL offer Home, Today (see day-timeline), Settings with the sync panel, the task page (opened from a task) and focus mode. Plan, the weekly review, Stats and their pages SHALL NOT be reachable from the phone's navigation.

#### Scenario: No Plan on the phone
- **WHEN** the bottom navigation is shown
- **THEN** it has no entry for Plan, Review or Stats

#### Scenario: Connect to the server
- **WHEN** the user opens Settings on the phone, enters the server address and the device token and connects
- **THEN** the sync starts and the phone shows the same tasks as the desktop after it finishes
