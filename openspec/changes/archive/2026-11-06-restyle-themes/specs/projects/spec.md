# Spec Delta

## ADDED Requirements

### Requirement: Project colour
A project SHALL have a colour, one of the eight project colours of the theme (see visual-design, "Project colour coding"). A new project SHALL get the colour that the fewest existing projects use, the first of them in palette order when several tie. The user SHALL be able to change the colour in the project form. A project without a stored colour (created before this existed) SHALL show a colour derived from its identity, the same on every device, until the user chooses one.

#### Scenario: Colours differ
- **WHEN** the user creates three projects in a row
- **THEN** they get three different colours

#### Scenario: Least used first
- **WHEN** eight projects use all eight colours once, and one colour is freed by deleting its project
- **THEN** the next new project gets that colour

#### Scenario: Change the colour
- **WHEN** the user picks another colour for the project "Garden redesign" in its form and saves
- **THEN** the project shows the new colour everywhere

#### Scenario: Older project
- **WHEN** a project has no stored colour
- **THEN** it shows a colour that is the same on the desktop and in the browser
