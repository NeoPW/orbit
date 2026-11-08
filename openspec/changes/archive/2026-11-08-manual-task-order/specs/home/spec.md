## MODIFIED Requirements

### Requirement: Task rank
A task's rank SHALL be importance × urgency. Importance SHALL be the task's own, else its project's, else 3. Urgency (see "Project urgency") SHALL come from the task's due date, else its project's effective deadline, else its goal's end date, else 1. Higher ranks come first; ties SHALL be broken by the nearest due date or inherited deadline (none last), then by creation (oldest first). Among tasks of one project that are still tied after the date and have a manual position (see tasks, "Reorder open tasks"), the position SHALL decide their order instead of creation; tasks of other projects keep their places.

#### Scenario: Rank
- **WHEN** task A has importance 2 and is overdue (rank 10) and task B has importance 5 and no deadline (rank 5)
- **THEN** A comes before B

#### Scenario: Inherited importance and urgency
- **WHEN** a task without own importance or due date belongs to a project with importance 4 and a deadline in 2 days
- **THEN** its rank is 16

#### Scenario: Goal's end date
- **WHEN** a task without due date is assigned to a goal that ends in 20 days
- **THEN** its urgency is 2

#### Scenario: Tie
- **WHEN** two tasks have the same rank and only one has a due date
- **THEN** the one with the due date comes first

#### Scenario: Project order breaks a tie
- **WHEN** two next steps of one project have the same rank and date, "Write intro" was created first, and the user moved "Book venue" above "Write intro" in the project
- **THEN** Home lists "Book venue" before "Write intro"

#### Scenario: Rank still wins
- **WHEN** the user moved "Book venue" above "Write intro", but "Write intro" has the higher rank
- **THEN** Home lists "Write intro" first

#### Scenario: Other projects keep their places
- **WHEN** a task of another project sits between two tied tasks of one project that were reordered
- **THEN** the other project's task keeps its place in the list
