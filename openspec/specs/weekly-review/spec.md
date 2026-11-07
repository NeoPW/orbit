# weekly-review Specification

## Purpose

Lets the user review a week: see it at a glance, walk through projects and goals, score it, reflect and plan the next week, and look back at earlier reviews and the current plan.

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
The Review tab SHALL show one week, the shown week: the current week unless another week is chosen with the week switcher. From top to bottom it SHALL show:
- the plan for the shown week: the plan written in the completed review of the week before it, or a hint that there is none (see "Plan of a week")
- the summary of the shown week, so far for the current week (see week-summary)
- a button to review the review week
- an entry to the review history

The button SHALL read:
- "Start weekly review" when the review week has no review
- "Continue weekly review" when it has an unfinished draft
- "Edit weekly review" when it is completed

#### Scenario: No review yet
- **WHEN** no review exists
- **THEN** the Review tab says there is no plan yet and offers "Start weekly review"

#### Scenario: Plan shown
- **WHEN** the completed review of last week has the plan "Finish chapter 3" and the current week is shown
- **THEN** the Review tab shows "Finish chapter 3" at the top

#### Scenario: Completed week
- **WHEN** the review week's review is completed
- **THEN** the button reads "Edit weekly review"

#### Scenario: Button above the history
- **WHEN** the Review tab is shown
- **THEN** the review button comes after the shown week's summary and directly before the history

#### Scenario: Current week on a Monday
- **WHEN** today is Monday 2026-10-12 and work was logged today
- **THEN** the Review tab shows CW 42 with today's work, while the review button still refers to CW 41

### Requirement: Guided review steps
The weekly review SHALL lead through six steps in order: 1 look back (the week summary), 2 projects, 3 goals, 4 score and reflection, 5 plan for next week, 6 save. Each step SHALL fill the screen, with a progress bar and the step's name at the top and Back / Next buttons at the bottom. The user SHALL be able to go back and forth between steps and leave the review at any time.

#### Scenario: Step order
- **WHEN** the user starts the weekly review and moves forward
- **THEN** the steps appear in the order look back, projects, goals, score, plan, save

#### Scenario: Progress
- **WHEN** the user is on the goals step
- **THEN** the progress bar shows step 3 of 6

### Requirement: Projects step
The projects step SHALL go through every active project with its open tasks. For each, the user SHALL be able to change its status (active, paused, backlog, completed), mark and unmark next steps, add a task as next step, change its importance and deadline, and write its weekly note for the review week (see weekly-notes). Changes SHALL be applied immediately, as anywhere else in the app.

#### Scenario: Pause a project
- **WHEN** the user pauses the project "Garden" in the projects step
- **THEN** "Garden" has status paused and appears in the Backlog

#### Scenario: New next step
- **WHEN** the user adds "Order seeds" as next step of "Garden"
- **THEN** "Order seeds" is an open task of "Garden" and one of its next steps

#### Scenario: Importance and deadline
- **WHEN** the user sets the importance of "Garden" to 4 and its deadline to 2026-11-01
- **THEN** "Garden" has importance 4 and deadline 01-11-2026

#### Scenario: Weekly note
- **WHEN** the user writes "Beds prepared" for "Garden"
- **THEN** the note of "Garden" for the review week is "Beds prepared"

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
Saving SHALL mark the review as completed (setting its completion time) and SHALL store, for every measure of an active goal, a snapshot of its progress at that moment. Saving an already completed review again SHALL update it and replace its snapshots.

#### Scenario: Save
- **WHEN** the user saves a review with score 8
- **THEN** the review is completed with score 8 and a snapshot exists for each measure of an active goal

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

### Requirement: Goals step
The goals step SHALL list every active goal with its progress and, below it, its measures. The user SHALL be able to change the goal's status, a numeric measure's current value and a boolean measure's achieved state, and write the goal's weekly note for the review week; changes SHALL be applied immediately. Habit measures SHALL be shown with their progress but not be editable.

#### Scenario: Update a numeric value
- **WHEN** the user changes "Run 100 km" from 40 to 55 in the goals step
- **THEN** the measure's current value is 55 and the progress of its goal updates

#### Scenario: Habit measure read-only
- **WHEN** an active goal has a habit measure
- **THEN** it is shown with its progress and no input

#### Scenario: Goal without measures
- **WHEN** an active goal has no measures
- **THEN** it is listed without a percentage and without inputs

#### Scenario: Complete a goal
- **WHEN** the user sets "Get fit" to completed in the goals step
- **THEN** "Get fit" is completed and listed in the Archive

#### Scenario: Goal note
- **WHEN** the user writes "Two runs missed" for "Get fit"
- **THEN** the note of "Get fit" for the review week is "Two runs missed"

### Requirement: Week switcher
The Review tab's header SHALL contain:
- the shown week's range
- buttons for the previous and the next week
- a "This week" button while another week is shown

The next-week button SHALL be disabled while the current week is shown. The shown week SHALL be kept in the address, so reloading and going back keep it. Opening the Review tab from the navigation SHALL show the current week.

#### Scenario: Previous week
- **WHEN** CW 45 is the current week and the user presses the previous-week button
- **THEN** the summary of CW 44 is shown with the plan written in the review of CW 43

#### Scenario: Back to this week
- **WHEN** a past week is shown and the user presses "This week"
- **THEN** the current week's summary and its plan are shown again

#### Scenario: No future weeks
- **WHEN** the current week is shown
- **THEN** the next-week button is disabled and "This week" is not shown

#### Scenario: Navigation shows the current week
- **WHEN** a past week is shown and the user selects Review in the navigation
- **THEN** the current week is shown

### Requirement: Plan of a week
The plan shown for a week SHALL be the plan written in the completed review of the week before it. A draft SHALL NOT count. Without such a review, a hint that there is no plan SHALL be shown. Old plans SHALL stay available: each review keeps its plan.

#### Scenario: Plan of a past week
- **WHEN** CW 43 was reviewed with the plan "Draft chapter 4" and CW 44 is shown
- **THEN** the plan for CW 44 reads "Draft chapter 4"

#### Scenario: Week before was not reviewed
- **WHEN** the review of CW 43 was never completed and CW 44 is shown
- **THEN** the plan section says there is no plan yet

#### Scenario: Draft
- **WHEN** the review of CW 43 is an unfinished draft with a plan
- **THEN** CW 44 shows no plan

### Requirement: Calendar weeks
Every week the app names SHALL be shown by its ISO calendar week number as "CW 45", with the date range (Monday–Sunday) beside it where there is room: the Review header, the history, the review flow, the week page of a past review, weekly notes and the review reminder. Chart labels SHALL use "CW 45" with the date range as tooltip.

#### Scenario: Review header
- **WHEN** the week of Monday 2026-11-02 is shown
- **THEN** the header reads "CW 45" with 02-11-2026 – 08-11-2026

#### Scenario: Year boundary
- **WHEN** the week of Monday 2026-12-28 is shown
- **THEN** it is "CW 53", and the week of 2027-01-04 is "CW 1"
