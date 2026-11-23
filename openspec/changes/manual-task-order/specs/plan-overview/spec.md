# Spec Delta

## MODIFIED Requirements

### Requirement: Project entries
Each project entry in the Plan tab SHALL show its title, area and effective deadline (or that it has none). Within a section or goal, projects SHALL be ordered by effective deadline (earliest first, none last), then by time added (oldest first).

#### Scenario: Project ordering
- **WHEN** a goal has active projects A (deadline 2026-11-01, added last), B (no deadline, added first) and C (no deadline, added second)
- **THEN** they are listed in the order A, B, C
