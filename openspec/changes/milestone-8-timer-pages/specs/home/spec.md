# Spec Delta

## MODIFIED Requirements

### Requirement: Home sections
The Home tab SHALL show, from top to bottom, the today header, the timer card while a timer runs (see work-timer), and the sections "Habits due today", "Upcoming deadlines", "Active projects" and "Tasks". A section without items SHALL show a short empty state instead of being hidden.

#### Scenario: Section order
- **WHEN** there are due habits, upcoming deadlines, active projects and open tasks outside projects
- **THEN** Home shows habits first, then deadlines, then projects, then tasks

#### Scenario: Empty section
- **WHEN** no habit is due today
- **THEN** the "Habits due today" section shows an empty state and the other sections are still shown

#### Scenario: Timer card position
- **WHEN** a timer runs
- **THEN** the timer card is shown between the today header and "Habits due today"
