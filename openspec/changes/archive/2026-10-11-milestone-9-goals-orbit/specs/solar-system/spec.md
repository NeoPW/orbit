# Spec Delta

## Purpose

Shows all current work as one solar system, large on the Plan tab and compact on Home: a sun for the user, the active goals as planets, the projects serving them as moons and projects without a goal as loose asteroids, so it is visible at a glance which goals the work serves.

## ADDED Requirements

### Requirement: One solar system on Plan and Home
The Plan tab's Overview SHALL show the solar system at full size above the goals: a sun in the middle with orbits around it. Home SHALL show a compact version below the today header, at full width and about 150 logical pixels high: the sun at the left edge, cut in half, and the planets in a row to its right in goal order, each on its own orbit arc around the sun, with the asteroids on a belt arc beyond the last planet. Both SHALL be shown when there is at least one active goal or one active project, and SHALL be left out otherwise.

#### Scenario: Shown
- **WHEN** there is one active goal and no projects
- **THEN** the Plan tab shows the solar system with one planet above the goal, and Home shows the compact one

#### Scenario: Compact on Home
- **WHEN** Home shows the solar system with the goals "Get job" and "Family++"
- **THEN** it is lower than the one on the Plan tab and spans the full width, the sun is at its left edge, and "Get job" and "Family++" sit in a row to the right of it, "Get job" closer to the sun

#### Scenario: Nothing to show
- **WHEN** there are no active goals and no active projects
- **THEN** neither the Plan tab nor Home shows a solar system

### Requirement: Goals as planets
Each active goal SHALL be a planet on its own orbit around the sun, in the goal's color, labeled with its title. Planets SHALL follow the goal order, the first goal on the innermost orbit. Tapping a planet or its label SHALL open the goal page.

#### Scenario: Order
- **WHEN** the active goals are "Get job" and then "Family++"
- **THEN** "Get job" orbits closer to the sun than "Family++"

#### Scenario: Open a goal
- **WHEN** the user taps the planet "Get job"
- **THEN** the goal page of "Get job" opens

#### Scenario: Non-active goal
- **WHEN** a goal is completed
- **THEN** it has no planet

### Requirement: Planet brightness and ring
A planet SHALL grow brighter with its goal's progress. When every measure of the goal is reached, the planet SHALL get a ring. A goal without measures SHALL be drawn at medium brightness without a ring.

#### Scenario: All measures reached
- **WHEN** both measures of "Family++" are at 100 %
- **THEN** its planet has a ring

#### Scenario: Partly reached
- **WHEN** a goal is at 60 % with one measure reached and one at 20 %
- **THEN** its planet has no ring

### Requirement: Planet surfaces
Planets SHALL show surface structure instead of a flat color: bands, craters or patches, lit from the top left. The kind and layout SHALL follow from the goal's ID, so a planet looks the same on every run and device.

#### Scenario: Stable look
- **WHEN** the app is restarted
- **THEN** each planet shows the same surface as before

### Requirement: Projects as moons
Each active project serving an active goal SHALL be a moon of that goal's planet, about 0.4 times the planet's radius and drawn as a cratered body, in the project's area color, or a neutral color without an area. Moons on the far side of the orbit SHALL be drawn behind the planet. A planet SHALL show at most six moons. Moons SHALL NOT be labeled.

#### Scenario: Moon in area color
- **WHEN** the active project "Create app" in the area "Job" (blue) serves "Get job"
- **THEN** the planet "Get job" has a blue moon

#### Scenario: Paused project
- **WHEN** a project serving "Get job" is paused
- **THEN** it is not a moon

#### Scenario: Many projects
- **WHEN** eight active projects serve one goal
- **THEN** its planet shows six moons

### Requirement: Projects without a goal as asteroids
Each active project without an active goal SHALL be a loose asteroid: a small irregular rock in its area color (neutral without an area) on a belt outside the outermost planet. At most twelve asteroids SHALL be shown. Asteroids SHALL NOT be labeled; tapping one SHALL open its project detail.

#### Scenario: Asteroid
- **WHEN** the active project "Bier" serves no goal
- **THEN** the solar system shows an asteroid for it and no moon

#### Scenario: Goal not active
- **WHEN** an active project serves a goal that is completed
- **THEN** it is shown as an asteroid

#### Scenario: Open from an asteroid
- **WHEN** the user taps the asteroid of "Bier"
- **THEN** the project detail of "Bier" opens

### Requirement: Static and live
The solar system SHALL be drawn without continuous animation. It SHALL update immediately after changes to goals, measures, projects and areas.

#### Scenario: New project
- **WHEN** the user creates an active project serving "Get job" and returns to Home
- **THEN** "Get job" has one more moon

#### Scenario: No running animation
- **WHEN** Home is shown and nothing changes
- **THEN** nothing in the solar system moves
