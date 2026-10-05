# Spec Delta

## MODIFIED Requirements

### Requirement: Three top-level destinations
The app SHALL provide exactly three top-level destinations, in this order: Plan, Home, Review. Selecting a destination SHALL show its screen and mark it as selected.

#### Scenario: Switch destination
- **WHEN** the user selects Plan
- **THEN** the Plan screen is shown and Plan is marked as selected

#### Scenario: Home content
- **WHEN** the user selects Home
- **THEN** the Home screen with its sections is shown (see home)

#### Scenario: Placeholder destinations
- **WHEN** the user selects Review
- **THEN** the Review screen is shown (see weekly-review) and no destination is a placeholder
