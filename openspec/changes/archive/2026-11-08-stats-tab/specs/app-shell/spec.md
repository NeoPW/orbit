## RENAMED Requirements

- FROM: `### Requirement: Three top-level destinations`
- TO: `### Requirement: Top-level destinations`

## MODIFIED Requirements

### Requirement: Top-level destinations
The app SHALL provide exactly four top-level destinations, in this order: Home, Plan, Review, Stats, and Settings apart from them. Selecting a destination SHALL show its screen and mark it as selected. Until a destination's feature change fills it, its screen SHALL show its title and an empty state.

#### Scenario: Switch destination
- **WHEN** the user selects Plan
- **THEN** the Plan screen is shown and Plan is marked as selected

#### Scenario: Home content
- **WHEN** the user selects Home
- **THEN** the Home screen is shown and Home is marked as selected

#### Scenario: Stats
- **WHEN** the user selects Stats
- **THEN** the Stats screen is shown and Stats is marked as selected

#### Scenario: Settings
- **WHEN** the user selects Settings
- **THEN** the Settings screen is shown, Settings is marked as selected and no other destination is

#### Scenario: Placeholder destinations
- **WHEN** the user selects Review before the review feature exists
- **THEN** the Review screen shows its title and an empty state, without placeholder text such as "Coming soon"

### Requirement: Sidebar navigation
The app SHALL show the destinations in a sidebar on the left, with Settings at its foot. At a window width of 960 logical pixels or more the sidebar SHALL show each destination's icon and label; below that only the icons, each with its label as accessible name and tooltip. Resizing SHALL NOT change the selected destination.

#### Scenario: Wide window
- **WHEN** the window is 1280 pixels wide
- **THEN** the sidebar shows Home, Plan, Review and Stats with icons and labels, and Settings at its foot

#### Scenario: Narrow window
- **WHEN** the window is 800 pixels wide
- **THEN** the sidebar shows only the icons, and hovering an icon shows its label

#### Scenario: Resize keeps destination
- **WHEN** Plan is selected and the window is resized across 960 pixels
- **THEN** Plan remains selected and its screen remains visible

#### Scenario: Keyboard
- **WHEN** the user moves through the sidebar with Tab and presses Enter on Review
- **THEN** the Review screen is shown

### Requirement: Addressable destinations
Each destination SHALL have its own URL path (`/home`, `/plan`, `/review`, `/stats`, `/settings`), on the desktop and in the browser. Reloading SHALL stay on the current destination, and the browser's back and forward SHALL move between visited destinations. The root path and unknown paths SHALL show Home under the path `/home`.

#### Scenario: Reload keeps destination
- **WHEN** the user is on Plan and reloads the page
- **THEN** the app opens on Plan

#### Scenario: Back
- **WHEN** the user goes from Home to Plan to Settings and then goes back
- **THEN** Plan is shown and selected

#### Scenario: Unknown path
- **WHEN** the app is opened at `/does-not-exist`
- **THEN** the Home destination is shown and the path is `/home`

#### Scenario: Root path
- **WHEN** the app is opened at `/`
- **THEN** the Home destination is shown and the path is `/home`

#### Scenario: Stats address
- **WHEN** the app is opened at `/stats`
- **THEN** the Stats destination is shown and selected
