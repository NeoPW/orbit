## MODIFIED Requirements

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

## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Last week page
**Reason**: Replaced by the week switcher, which shows any past week on the Review tab and leads back to the current week.
**Migration**: Press the previous-week button once on the Review tab; the `/review/last-week` address no longer exists.
