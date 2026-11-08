## ADDED Requirements

### Requirement: Esc releases keyboard focus
On Home, `Esc` SHALL clear the highlight of a To do task or habit. On every screen, `Esc` SHALL take the keyboard focus (the focus ring shown after `Tab`) off a button, link or other control that is not inside a dialog, sheet or menu, and do nothing else with that key press. Focus a control got from a mouse click SHALL NOT count. While no highlight and no keyboard focus exist, `Esc` SHALL keep its other meanings (go back, leave focus mode).

#### Scenario: Clear the highlight
- **WHEN** the user presses `2` on Home and then `Esc`
- **THEN** no task is highlighted and pressing `Space` starts nothing

#### Scenario: Leave a tabbed button
- **WHEN** the user presses `Tab` until a button on Plan shows the focus ring and then presses `Esc`
- **THEN** no element shows the focus ring and `Shift+H` opens Home

#### Scenario: Focus mode keeps Esc after a click
- **WHEN** the user clicks Pause in focus mode and then presses `Esc`
- **THEN** focus mode is left

#### Scenario: Keyboard focus in focus mode
- **WHEN** a button in focus mode has keyboard focus and the user presses `Esc` twice
- **THEN** the first `Esc` takes the focus off the button and the second leaves focus mode

## MODIFIED Requirements

### Requirement: Esc goes back on detail pages
On a project, goal or task page, `Esc` SHALL go back to the screen the page was opened from. When the page was opened directly by its address, `Esc` SHALL open the screen it belongs to (Plan). `Esc` SHALL NOT go back while a field has the focus (it leaves the field first, see "Leave a field with Esc"), while a control has keyboard focus (it releases it first, see "Esc releases keyboard focus") or while a popup, sheet or dialog is open (it closes that).

#### Scenario: Back to Home
- **WHEN** the user opened the project "Portfolio site" from Home and presses `Esc`
- **THEN** Home is shown again

#### Scenario: Popup first
- **WHEN** the task popup is open over a project page and the user presses `Esc` twice
- **THEN** the first `Esc` closes the popup and the second goes back from the project page

#### Scenario: Opened by address
- **WHEN** the user opened `/projects/<id>` directly and presses `Esc`
- **THEN** Plan is shown

#### Scenario: Keyboard focus first
- **WHEN** a button on a project page has keyboard focus and the user presses `Esc` twice
- **THEN** the first `Esc` takes the focus off the button and the second goes back
