## ADDED Requirements

### Requirement: Value history
Every change of a numeric measure's current value SHALL be recorded with the time of the change, the value before and the value after. This includes changes from the − / + buttons, direct entry, the measure form and the review's goals step.

Every change of a yes/no measure's achieved state SHALL be recorded the same way.

The following SHALL NOT be recorded:
- creating a measure
- saving the same value again
- changing a measure's type

The value of a measure at a given moment SHALL be the value before the first recorded change after that moment, or its current value when no change was recorded after it. The history SHALL be synced like other records.

#### Scenario: Step recorded
- **WHEN** the user presses + on a measure at 7 with step 1
- **THEN** a change from 7 to 8 is recorded with the current time

#### Scenario: Same value
- **WHEN** the user enters 8 for a measure that is already at 8
- **THEN** no change is recorded

#### Scenario: Value at a moment
- **WHEN** a measure was changed from 7 to 8 on Tuesday and from 8 to 9 on Thursday and is at 9 now
- **THEN** its value was 7 on Monday, 8 on Wednesday and 9 on Friday

#### Scenario: No later change
- **WHEN** a measure at 5 has no recorded change after Monday
- **THEN** its value on Monday is 5

#### Scenario: Type changed
- **WHEN** the user changes a measure's type from numeric to yes/no in the measure form
- **THEN** no change is recorded
