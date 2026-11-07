# Spec Delta

## ADDED Requirements

### Requirement: Resumed stretches as one block
Timer blocks of the same task, habit or project SHALL be drawn as one block when at most 10 minutes lie between the end of one and the start of the next, also across several pauses and including the running stretch. The block SHALL run from the first start to the last end, and its minutes SHALL be the sum of the stretches, without the pauses. Blocks with a longer gap, of different items, or not from a timer SHALL stay separate.

#### Scenario: Short pause
- **WHEN** "Thesis" has timer stretches 10:00–10:30 and 10:35–11:00
- **THEN** one block "Thesis" runs from 10:00 to 11:00 with 55 minutes

#### Scenario: Long pause
- **WHEN** "Thesis" has timer stretches 10:00–10:30 and 10:45–11:00
- **THEN** two blocks are drawn

#### Scenario: Running after a short pause
- **WHEN** "Thesis" logged a stretch 09:00–09:30, was resumed at 09:35 and it is 09:50
- **THEN** one block runs from 09:00 to 09:50, marked as running

#### Scenario: Different items
- **WHEN** a timer stretch for "Thesis" ends at 10:30 and one for "Garden" starts at 10:32
- **THEN** two blocks are drawn

#### Scenario: Manual entry
- **WHEN** a Log work entry for "Thesis" ends at 10:00 and a timer stretch for "Thesis" starts at 10:05
- **THEN** two blocks are drawn

## MODIFIED Requirements

### Requirement: Running session
A running focus session SHALL be drawn as a block from its start to the current time, marked as running (for example with a striped fill), growing with time. It SHALL become a normal block when the session is paused or completed and its stretch is logged; a paused session SHALL have no running block.

#### Scenario: Running
- **WHEN** a focus session for "Rerun benchmarks" started at 09:00 and it is 09:20
- **THEN** its block runs from 09:00 to 09:20, marked as running

#### Scenario: Paused
- **WHEN** that session is paused at 09:20
- **THEN** a normal block runs from 09:00 to 09:20 and no running block is drawn
