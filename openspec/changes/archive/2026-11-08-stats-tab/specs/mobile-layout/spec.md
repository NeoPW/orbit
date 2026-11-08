## MODIFIED Requirements

### Requirement: Screens on the phone
The phone SHALL offer Home, Today (see day-timeline), Settings with the sync panel, the task page (opened from a task) and focus mode. Plan, the weekly review, Stats and their pages SHALL NOT be reachable from the phone's navigation.

#### Scenario: No Plan on the phone
- **WHEN** the bottom navigation is shown
- **THEN** it has no entry for Plan, Review or Stats

#### Scenario: Connect to the server
- **WHEN** the user opens Settings on the phone, enters the server address and the device token and connects
- **THEN** the sync starts and the phone shows the same tasks as the desktop after it finishes
