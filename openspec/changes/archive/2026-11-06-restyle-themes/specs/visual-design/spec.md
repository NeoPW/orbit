# Spec Delta

## MODIFIED Requirements

### Requirement: Orbit palette
The app SHALL use a dark palette defined by the selected colour theme (see "Colour themes"): a near-black ground, slightly lighter surfaces and raised surfaces, hairline borders, one accent colour for primary actions and selection, amber for urgency ("soon") and red for overdue. The app SHALL be dark only and ignore the system's light mode. Area colors SHALL be used as small dots on chips. Body text SHALL meet a 4.5:1 contrast ratio on every surface of every theme.

#### Scenario: Dark mode surfaces
- **WHEN** the app is shown
- **THEN** screens use the dark ground of the selected theme, never white or a neutral default grey

#### Scenario: System in light mode
- **WHEN** the operating system or browser is set to light mode
- **THEN** the app still uses its dark look

#### Scenario: Area accent
- **WHEN** a project belongs to the area "Job" with color blue
- **THEN** its area chip shows a blue dot

### Requirement: Typography
All text SHALL use the bundled Inter typeface, also offline: headings and page titles in semibold, and timers and figures in tabular numerals. Titles SHALL be visually stronger than body text, and secondary information SHALL be smaller and muted.

#### Scenario: Offline font
- **WHEN** the app starts without network
- **THEN** all text is rendered in Inter

#### Scenario: Steady timer
- **WHEN** a focus timer counts from 9:59 to 10:00
- **THEN** its digits keep their width and the timer does not shift sideways

## ADDED Requirements

### Requirement: Colour themes
The app SHALL offer five dark colour themes: Slate, Forest, Ember, Plum and Graphite. A theme SHALL define the ground, surfaces, border, text, accent, overdue and soon colours and the eight project colours; layout, type, spacing and radii SHALL be identical in every theme. The user SHALL be able to switch themes at any time, from the sidebar and from Settings, with the change visible at once on every screen. The choice SHALL be kept on the device, and the app SHALL start in it, without first showing another theme. Slate SHALL be the default.

#### Scenario: Switch live
- **WHEN** the user chooses Forest in the theme switcher while on Plan
- **THEN** Plan is shown in the Forest colours at once, with the same layout

#### Scenario: Kept across restarts
- **WHEN** the user chooses Ember and restarts the app
- **THEN** the app starts in Ember without showing Slate first

#### Scenario: Default
- **WHEN** the app starts on a new installation
- **THEN** it uses Slate

#### Scenario: Contrast in every theme
- **WHEN** any theme is used
- **THEN** text and muted text meet 4.5:1 on its surfaces, and each project colour meets 3:1 on them

### Requirement: Project colour coding
Every project SHALL be shown in its own colour, the same everywhere it appears: a rail and tint on its tile and page header, a coloured chip with its name on its tasks and habits, and a rail on its next steps. A task SHALL take the colour of its project; a task without a project SHALL be neutral. Colour SHALL never be the only carrier of meaning: the project's name is always shown next to its colour.

#### Scenario: Task row
- **WHEN** the task "Rerun benchmarks" of the project "Chapter 4: Evaluation" is listed in To do
- **THEN** the row shows a chip "Chapter 4: Evaluation" in that project's colour

#### Scenario: Same colour on every screen
- **WHEN** the project "Portfolio site" is orange on Home
- **THEN** it is orange on Plan, its project page, its tasks and the focus panel

#### Scenario: Standalone task
- **WHEN** a standalone task is listed
- **THEN** it has no project chip and no rail colour

#### Scenario: Colour follows the theme
- **WHEN** the user switches the theme
- **THEN** every project keeps its colour slot and shows that slot's colour in the new theme

### Requirement: Modular tiles
Content SHALL be arranged in tiles: cards with radii from 14 to 20 px, a 1 px border and at most a very soft shadow, on a calm ground without textures, patterns or decorative illustrations. Each tile SHALL have one clear purpose and a short heading.

#### Scenario: Plan goal card
- **WHEN** Plan shows a goal
- **THEN** the goal is one tile with its progress, its measures on one side, and its projects and open tasks on the other

#### Scenario: No decoration
- **WHEN** any screen is shown
- **THEN** it contains no background texture, photo or decorative illustration
