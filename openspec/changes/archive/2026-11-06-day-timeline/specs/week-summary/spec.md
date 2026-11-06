# Spec Delta

## ADDED Requirements

### Requirement: Work by day
The summary SHALL show the work of each day of the week, Monday to Sunday, as seven timelines side by side on one shared hour axis (see day-timeline), each headed with its weekday and date. Days after today in the current week SHALL be shown empty.

#### Scenario: A week of work
- **WHEN** work was logged on Monday and Wednesday of the week
- **THEN** the seven day columns are shown, with blocks in the Monday and Wednesday columns only

#### Scenario: Past review
- **WHEN** the review of a past week is opened
- **THEN** its summary shows the work of each of that week's days

#### Scenario: Colours match the projects
- **WHEN** a block belongs to the project "Portfolio site"
- **THEN** it has the same colour as that project everywhere else
