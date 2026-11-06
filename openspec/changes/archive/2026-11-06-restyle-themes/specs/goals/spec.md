# Spec Delta

## MODIFIED Requirements

### Requirement: Goal color swatches
The goal form SHALL offer the eight project colours of the theme as swatches (a goal's colour is one of the same palette slots as a project's), and "Auto". A goal with "Auto" SHALL get a palette colour by its position in the goal order, so neighboring goals differ. A goal colour saved before themes existed SHALL keep working and be shown as it was. The goal's color SHALL mark the goal in Plan and on its page and SHALL color the progress bars of the goal and its measures.

#### Scenario: Pick a color
- **WHEN** the user picks the second swatch for "Get fit" and saves
- **THEN** "Get fit" is marked in that slot's colour in Plan and its progress bars use it

#### Scenario: Back to Auto
- **WHEN** the user chooses Auto for a goal with its own color and saves
- **THEN** the goal has no own color and uses the palette color of its position

#### Scenario: Colour follows the theme
- **WHEN** the user switches the theme
- **THEN** a goal with a palette colour shows the same slot in the new theme

#### Scenario: Older goal colour
- **WHEN** a goal has the stored colour `#FB7185`
- **THEN** it is shown in that colour in every theme
