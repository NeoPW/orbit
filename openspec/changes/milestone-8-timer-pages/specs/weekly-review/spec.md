# Spec Delta

## ADDED Requirements

### Requirement: Last week page
The Review tab SHALL end with a "Last week" button that opens a page with the summary of the Monday–Sunday week before the current week (see week-summary), titled with that week's range.

#### Scenario: Open last week
- **WHEN** today is Wednesday 2026-10-07 and the user taps "Last week"
- **THEN** a page "Week 28-09-2026 – 04-10-2026" with that week's summary opens

## MODIFIED Requirements

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
