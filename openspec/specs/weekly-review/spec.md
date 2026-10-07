# weekly-review Specification

## Purpose

Lets the user review a week: see it at a glance, walk through projects and key results, score it, reflect and plan the next week, and look back at earlier reviews and the current plan.

## Requirements

### Requirement: Review week
The week a review is about (the review week) SHALL be the Monday–Sunday week ending today when today is a Sunday, and the previous Monday–Sunday week on any other day. There SHALL be at most one review per week.

#### Scenario: Sunday
- **WHEN** today is Sunday 2026-10-11
- **THEN** the review week is 05-10-2026 – 11-10-2026

#### Scenario: Monday
- **WHEN** today is Monday 2026-10-12
- **THEN** the review week is 05-10-2026 – 11-10-2026

#### Scenario: Saturday
- **WHEN** today is Saturday 2026-10-10
- **THEN** the review week is 28-09-2026 – 04-10-2026

### Requirement: Review tab
The Review tab SHALL show, from top to bottom: the plan for this week from the most recently completed review (or a hint that there is none yet), the summary of the current week so far (see week-summary), a button to review the review week, an entry to the review history, and the "Last week" button. The button SHALL read "Start weekly review" when the review week has no review, "Continue weekly review" when it has an unfinished draft, and "Edit weekly review" when it is completed.

#### Scenario: No review yet
- **WHEN** no review exists
- **THEN** the Review tab says there is no plan yet and offers "Start weekly review"

#### Scenario: Plan shown
- **WHEN** the latest completed review has the plan "Finish chapter 3"
- **THEN** the Review tab shows "Finish chapter 3" at the top

#### Scenario: Completed week
- **WHEN** the review week's review is completed
- **THEN** the button reads "Edit weekly review"

#### Scenario: Button above the history
- **WHEN** the Review tab is shown
- **THEN** the review button comes after the current week's summary and directly before the history

#### Scenario: Current week on a Monday
- **WHEN** today is Monday 2026-10-12 and work was logged today
- **THEN** the Review tab shows the week 12-10-2026 – 18-10-2026 with today's work, while the review button still refers to the week 05-10-2026 – 11-10-2026

### Requirement: Guided review steps
The weekly review SHALL lead through six steps in order: 1 look back (the week summary), 2 projects, 3 key results, 4 score and reflection, 5 plan for next week, 6 save. Each step SHALL fill the screen, with a progress bar and the step's name at the top and Back / Next buttons at the bottom. The user SHALL be able to go back and forth between steps and leave the review at any time.

#### Scenario: Step order
- **WHEN** the user starts the weekly review and moves forward
- **THEN** the steps appear in the order look back, projects, key results, score, plan, save

#### Scenario: Progress
- **WHEN** the user is on the key results step
- **THEN** the progress bar shows step 3 of 6

### Requirement: Projects step
The projects step SHALL list every active project with its next step. For each, the user SHALL be able to change its status (active, paused, backlog, completed) and to set or change its next step. Changes SHALL be applied immediately, as anywhere else in the app.

#### Scenario: Pause a project
- **WHEN** the user pauses the project "Garden" in the projects step
- **THEN** "Garden" has status paused and appears in the Backlog

#### Scenario: New next step
- **WHEN** the user sets "Order seeds" as next step of "Garden"
- **THEN** "Order seeds" is the project's next step

### Requirement: Key results step
The key results step SHALL list the numeric and boolean KRs of active objectives with their current progress, and SHALL let the user change a numeric KR's current value and a boolean KR's achieved state. Changes SHALL be applied immediately. Habit KRs SHALL be shown with their progress but not be editable.

#### Scenario: Update a numeric value
- **WHEN** the user changes "Run 100 km" from 40 to 55
- **THEN** the KR's current value is 55 and its progress updates

#### Scenario: Habit KR read-only
- **WHEN** an active objective has a habit KR
- **THEN** it is shown with its progress and no input

### Requirement: Score, reflection and plan
The score step SHALL ask for a score from 1 to 10 and a free-text reflection; the plan step SHALL ask for a free-text plan for next week. A review SHALL NOT be saved as completed without a score.

#### Scenario: Missing score
- **WHEN** the user reaches the save step without choosing a score
- **THEN** saving is not possible and the user is pointed to the score step

### Requirement: Drafts
Score, reflection and plan SHALL be stored as a draft review for the review week whenever the user moves to another step or leaves the review, so that leaving and starting again continues where the user left off. A draft SHALL NOT appear in the history.

#### Scenario: Continue later
- **WHEN** the user enters score 7 and a reflection, leaves the review and opens it again
- **THEN** score 7 and the reflection are still filled in and the button reads "Continue weekly review"

### Requirement: Save the review
Saving SHALL mark the review as completed (setting its completion time) and SHALL store, for every KR of an active objective, a snapshot of its progress at that moment. Saving an already completed review again SHALL update it and replace its snapshots.

#### Scenario: Save
- **WHEN** the user saves a review with score 8
- **THEN** the review is completed with score 8 and a snapshot exists for each KR of an active objective

#### Scenario: Edit a completed review
- **WHEN** the user edits the completed review of the review week, changes the score to 6 and saves
- **THEN** the same review now has score 6 and new snapshots

### Requirement: Review history
The app SHALL list all completed reviews, newest week first, each with its week range, score and the beginning of its plan. Tapping a review SHALL show its week, score, reflection and plan in full, followed by the summary of that week (see week-summary).

#### Scenario: History order
- **WHEN** reviews of the weeks starting 2026-09-28 and 2026-10-05 are completed
- **THEN** the history lists 05-10-2026 – 11-10-2026 first

#### Scenario: Open a past review
- **WHEN** the user taps a review in the history
- **THEN** its score, reflection and plan are shown in full

#### Scenario: Work of a past week
- **WHEN** the user opens the review of the week starting 2026-09-28, in which 3 entries were logged on "Thesis"
- **THEN** the page lists "Thesis" with 3 entries in that week's summary

### Requirement: Last week page
The Review tab SHALL end with a "Last week" button that opens a page with the summary of the Monday–Sunday week before the current week (see week-summary), titled with that week's range.

#### Scenario: Open last week
- **WHEN** today is Wednesday 2026-10-07 and the user taps "Last week"
- **THEN** a page "Week 28-09-2026 – 04-10-2026" with that week's summary opens
