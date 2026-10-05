# Spec Delta

## ADDED Requirements

### Requirement: Habit KR progress
Progress of a habit KR SHALL be the number of check-ins of its linked habit on or after its objective's start date, divided by the KR's target number of check-ins, clamped to 0–1. A habit KR without a linked habit SHALL have progress 0 and show "No habit linked". The KR SHALL show the count as "N / target check-ins" with the percentage.

#### Scenario: Halfway
- **WHEN** a habit KR has target 20 and its habit has 10 check-ins since the objective's start date
- **THEN** progress is 0.5 and the KR shows "10 / 20 check-ins · 50%"

#### Scenario: Check-ins before start ignored
- **WHEN** the objective starts 2026-10-01 and the habit was checked on 2026-09-30 and 2026-10-02
- **THEN** only the check on 2026-10-02 counts

#### Scenario: Beyond target
- **WHEN** a habit KR has target 5 and its habit has 7 check-ins since the start date
- **THEN** progress is 1

#### Scenario: No linked habit
- **WHEN** a habit KR has no linked habit
- **THEN** progress is 0 and the KR shows "No habit linked"

#### Scenario: Updates after check
- **WHEN** the user checks the linked habit on Home
- **THEN** the KR's progress in the Plan tab increases without a reload

## REMOVED Requirements

### Requirement: Habit KR progress not yet available
**Reason**: Habit checks exist from this change on, so habit KR progress is calculated.
**Migration**: See "Habit KR progress"; the note is replaced by a progress bar.
