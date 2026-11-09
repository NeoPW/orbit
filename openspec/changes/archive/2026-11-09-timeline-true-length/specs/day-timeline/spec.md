# Spec Delta

## MODIFIED Requirements

### Requirement: Work blocks
The timeline SHALL plot each log entry of the day that has a duration (a focus session or tracked time) as a block whose length is its duration. A timer entry SHALL start at its time; an entry of any other source SHALL end at its time (the work was done before it was logged). A block SHALL show what the work was for (the task, else the habit, else the project, else the goal, else the note) and, as far as its height allows, the project's name and the time range. A block's height SHALL follow its duration, with only a floor of 4 pixels so that the shortest block stays visible; a block too short for one line of text SHALL show no title. Its duration and note SHALL show when it is hovered or focused.

#### Scenario: Timer entry
- **WHEN** a timer entry at 09:00 has a duration of 45 minutes
- **THEN** its block runs from 09:00 to 09:45

#### Scenario: Manual entry
- **WHEN** a manual entry logged at 14:30 has a duration of 60 minutes
- **THEN** its block runs from 13:30 to 14:30

#### Scenario: Label
- **WHEN** a block belongs to the task "Rerun benchmarks" of "Chapter 4: Evaluation" and runs 09:00–10:30
- **THEN** it shows "Rerun benchmarks", "Chapter 4: Evaluation" and "09:00–10:30"

#### Scenario: Habit session
- **WHEN** a focus session on the habit "Run 5 km" of "Training block 3" ran 07:00–07:40
- **THEN** a block labelled "Run 5 km" in the colour of "Training block 3" runs from 07:00 to 07:40

#### Scenario: Short block
- **WHEN** a manual entry of 5 minutes is plotted at 48 pixels per hour
- **THEN** its block is 4 pixels high, shows no title, and hovering it shows its label, time range and duration

#### Scenario: Length shows
- **WHEN** entries of 30 and 90 minutes are plotted
- **THEN** the 90-minute block is three times as high as the 30-minute one, apart from the 1 pixel gap

#### Scenario: Another day
- **WHEN** an entry was logged yesterday
- **THEN** it is not shown on today's timeline
