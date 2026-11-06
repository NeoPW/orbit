# Spec Delta

## ADDED Requirements

### Requirement: Dropdown fields
A field that chooses one value from a list SHALL be a styled dropdown, not the browser's native one: a field-like button showing the chosen value and a chevron, opening a popup list on the app's own surface with the same radii, borders and colours as menus. The list SHALL support option groups and optional colour dots on options (for example project colours), SHALL be usable with the keyboard (Enter, Space or arrow keys open it, arrows move, Enter chooses, Escape closes and returns focus to the button, typing a letter jumps to a matching option) and SHALL close when clicking outside it. A dropdown inside a sheet SHALL open above the sheet's content and not be clipped by it.

#### Scenario: Styled list
- **WHEN** the user opens the task form's "Assigned to" dropdown
- **THEN** a popup list in the app's colours opens, with groups "Projects" and "Goals", and each project and goal has its colour dot

#### Scenario: Keyboard
- **WHEN** the dropdown has focus and the user presses the down arrow, then Enter
- **THEN** the next option is chosen and the list closes

#### Scenario: Escape
- **WHEN** the list is open and the user presses Escape
- **THEN** the list closes, the value is unchanged and focus is back on the dropdown

#### Scenario: In a sheet
- **WHEN** the dropdown of the task form's assignment is opened in a sheet
- **THEN** the whole list is visible and the sheet stays open when an option is chosen

#### Scenario: Outside click
- **WHEN** the list is open and the user clicks outside it
- **THEN** the list closes and the value is unchanged
