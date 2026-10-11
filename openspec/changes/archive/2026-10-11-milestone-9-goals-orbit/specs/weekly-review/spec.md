# Spec Delta

## ADDED Requirements

### Requirement: Goals step
The goals step SHALL list every active goal with its progress and, below it, its measures. The user SHALL be able to change a numeric measure's current value and a boolean measure's achieved state; changes SHALL be applied immediately. Habit measures SHALL be shown with their progress but not be editable.

#### Scenario: Update a numeric value
- **WHEN** the user changes "Run 100 km" from 40 to 55 in the goals step
- **THEN** the measure's current value is 55 and the progress of its goal updates

#### Scenario: Habit measure read-only
- **WHEN** an active goal has a habit measure
- **THEN** it is shown with its progress and no input

#### Scenario: Goal without measures
- **WHEN** an active goal has no measures
- **THEN** it is listed without a percentage and without inputs

## MODIFIED Requirements

### Requirement: Guided review steps
The weekly review SHALL lead through six steps in order: 1 look back (the week summary), 2 projects, 3 goals, 4 score and reflection, 5 plan for next week, 6 save. Each step SHALL fill the screen, with a progress bar and the step's name at the top and Back / Next buttons at the bottom. The user SHALL be able to go back and forth between steps and leave the review at any time.

#### Scenario: Step order
- **WHEN** the user starts the weekly review and moves forward
- **THEN** the steps appear in the order look back, projects, goals, score, plan, save

#### Scenario: Progress
- **WHEN** the user is on the goals step
- **THEN** the progress bar shows step 3 of 6

### Requirement: Save the review
Saving SHALL mark the review as completed (setting its completion time) and SHALL store, for every measure of an active goal, a snapshot of its progress at that moment. Saving an already completed review again SHALL update it and replace its snapshots.

#### Scenario: Save
- **WHEN** the user saves a review with score 8
- **THEN** the review is completed with score 8 and a snapshot exists for each measure of an active goal

#### Scenario: Edit a completed review
- **WHEN** the user edits the completed review of the review week, changes the score to 6 and saves
- **THEN** the same review now has score 6 and new snapshots

## REMOVED Requirements

### Requirement: Key results step
**Reason**: Key results are replaced by measures of goals.
**Migration**: See "Goals step" above.
