## ADDED Requirements

### Requirement: Reminder check
The server SHALL answer `POST /api/reminder-check` with whether a reminder is still needed, from the rows it holds:
- for a habit and a date: yes, unless the habit is deleted or inactive, or a check of the habit for that date exists that is not deleted
- for a task: yes while the task exists, is not deleted and is open
- for a project: yes while the project exists, is not deleted and is active

The request SHALL need a device token like the other requests and state the device's schema version (see "Same schema version only"). A body that names no habit with a date, task or project SHALL be refused with status 400. An id the server does not know SHALL be answered with yes, so a reminder for something not yet synced is still shown.

#### Scenario: Habit checked
- **WHEN** the server holds a check of habit "h1" for 2026-11-09 and the phone asks about habit "h1" on 2026-11-09
- **THEN** the answer is no

#### Scenario: Habit not checked
- **WHEN** the server holds no check of habit "h1" for 2026-11-09
- **THEN** the answer is yes

#### Scenario: Task done
- **WHEN** the task "t1" is done on the server and the phone asks about it
- **THEN** the answer is no

#### Scenario: Unknown task
- **WHEN** the phone asks about a task the server does not hold
- **THEN** the answer is yes

#### Scenario: No token
- **WHEN** the request has no valid device token
- **THEN** it is refused with status 401
