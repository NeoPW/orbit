# Spec Delta

## ADDED Requirements

### Requirement: Progress bars
A measure's progress and a goal's progress SHALL be shown as a slim bar in the goal's color with the percentage next to it. A goal without measures SHALL show no bar and no percentage.

#### Scenario: Measure bar color
- **WHEN** the goal "Get fit" is rose and its measure "Run 100 km" is at 45 %
- **THEN** the measure shows a rose bar filled to 45 % and "45 %"

#### Scenario: Goal without measures
- **WHEN** a goal has no measures
- **THEN** it shows no progress bar and no percentage

### Requirement: Menus
Status chips and overflow actions SHALL open a small menu next to them. A menu SHALL be usable with the keyboard (arrow keys move, Enter chooses, Escape closes and returns focus to its button) and SHALL close when clicking outside it.

#### Scenario: Status chip menu
- **WHEN** the user clicks the "Active" status chip of a project
- **THEN** a menu offers the other statuses next to the chip

#### Scenario: Escape
- **WHEN** a menu is open and the user presses Escape
- **THEN** the menu closes and focus is back on the chip

## REMOVED Requirements

### Requirement: Progress as orbit rings
**Reason**: Home no longer has a progress ring in its header, and the review summary and goal pages use bars.
**Migration**: Replaced by "Progress bars".

### Requirement: Two panes on wide screens
**Reason**: Goals, projects and tasks open as pages with their own addresses (see app-shell, "Detail page addresses"); back returns to the list.
**Migration**: None.
