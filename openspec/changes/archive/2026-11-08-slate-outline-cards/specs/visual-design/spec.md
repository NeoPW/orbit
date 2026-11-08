## ADDED Requirements

### Requirement: Slate card style
In the Slate theme, tiles SHALL have the colour of the ground and be set apart by their 1 px outline, and surfaces inside tiles (fields, raised rows, small project boxes) SHALL be one step lighter than the ground. Slate's eight project colours SHALL be saturated enough to stand out as the main colour on a screen: orange, blue, green, purple, pink, teal, lime and sand. A project's tile header SHALL keep its colour tint. In every theme, a To do row of a project SHALL be outlined clearly in that project's colour.

#### Scenario: Card on the ground
- **WHEN** Home is shown in Slate
- **THEN** the To do tile has the same colour as the page around it and is visible by its outline

#### Scenario: Project colour on To do
- **WHEN** the task "Email supervisor" of the orange project "Chapter 4: Evaluation" is in To do
- **THEN** its row is outlined in a clearly orange line

#### Scenario: Contrast kept
- **WHEN** Slate is used
- **THEN** text and muted text still meet 4.5:1 and each project colour 3:1 on its surfaces
