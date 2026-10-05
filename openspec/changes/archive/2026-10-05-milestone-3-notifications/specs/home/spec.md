# Spec Delta

## MODIFIED Requirements

### Requirement: Upcoming deadlines content
The "Upcoming deadlines" section SHALL list items whose own deadline is overdue or at most the deadline lead time (see settings, default 7 days) after today: open tasks of active projects (due date), active projects (own deadline), and KRs of active objectives with progress below 1 (own deadline). Deadlines inherited from a KR or objective SHALL NOT be listed. Without items, the section SHALL say that nothing is due in the next N days, N being the lead time.

#### Scenario: Within lead time
- **WHEN** today is 2026-10-05 and an open task of an active project is due 2026-10-12
- **THEN** the task is listed under upcoming deadlines

#### Scenario: Beyond lead time
- **WHEN** today is 2026-10-05 and an active project's own deadline is 2026-10-13
- **THEN** the project is not listed under upcoming deadlines

#### Scenario: Inherited deadline not listed
- **WHEN** an active project has no own deadline and its KR's deadline is tomorrow
- **THEN** only the KR is listed, not the project

#### Scenario: Task of a paused project
- **WHEN** an open task due tomorrow belongs to a paused project
- **THEN** the task is not listed

#### Scenario: Reached KR
- **WHEN** a KR of an active objective has its own deadline tomorrow and progress 1
- **THEN** the KR is not listed

#### Scenario: Shorter lead time
- **WHEN** the lead time is 3 days, today is 2026-10-05 and a task is due 2026-10-09
- **THEN** the task is not listed and, without other items, the section says "Nothing due in the next 3 days"
