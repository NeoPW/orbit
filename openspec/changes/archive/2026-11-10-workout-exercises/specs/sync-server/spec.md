# Spec Delta

## MODIFIED Requirements

### Requirement: Server tables
The server SHALL hold one table for each table the device syncs (areas, goals, measures, projects, tasks, habits, habit checks, log entries, timers, notes, daily notes, weekly reviews, review measure snapshots, exercises, workouts), with the same columns as on the device. Local settings SHALL NOT exist on the server. Rows SHALL come back exactly as they were pushed, including empty values.

#### Scenario: Round trip
- **WHEN** a goal with the color rose and no end date and a measure with step 5 are pushed and then pulled
- **THEN** the pulled goal has the color rose and an empty end date, and the pulled measure has step 5

#### Scenario: Settings are not a server table
- **WHEN** a push contains rows for the table `settings`
- **THEN** the push is refused as containing an unknown table

#### Scenario: Daily notes round trip
- **WHEN** the daily note of 2026-11-09 with the text "Call the bank" is pushed and then pulled
- **THEN** the pulled note has the date 2026-11-09 and the text "Call the bank"

#### Scenario: Workouts round trip
- **WHEN** the endurance exercise "Swim" with the unit m and a workout with the exercise ids [a, b] and no project are pushed and then pulled
- **THEN** the pulled exercise has the type endurance and the unit m, and the pulled workout has the exercise ids [a, b] and an empty project
