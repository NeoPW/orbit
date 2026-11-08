## ADDED Requirements

### Requirement: Review tab layout
The Review tab SHALL show one week, the shown week: the current week unless another week is chosen with the week switcher. It SHALL show:
- a header with the title, the week switcher and a button to review the review week, which names the review week in its tooltip
- the summary of the shown week, so far for the current week, as a dashboard (see week-summary, "Dashboard layout"), with these panels in the dashboard:
  - the plan for the shown week: the plan written in the completed review of the week before it, or a hint that there is none (see "Plan of a week")
  - the review history (see "Review history")

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

#### Scenario: Button in the header
- **WHEN** the Review tab is shown
- **THEN** the review button is in the header, right of the week switcher, and the history is a panel of the dashboard

#### Scenario: Current week on a Monday
- **WHEN** today is Monday 2026-10-12 and work was logged today
- **THEN** the Review tab shows CW 42 with today's work, while the review button still refers to CW 41

## MODIFIED Requirements

### Requirement: Review history
The app SHALL list the completed reviews, newest week first, each with its week and score, in a panel of the Review tab: the latest 5, and all of them after "Show all". Tapping a review SHALL show its week, score, reflection and plan in full, followed by the summary of that week (see week-summary).

#### Scenario: History order
- **WHEN** reviews of the weeks starting 2026-09-28 and 2026-10-05 are completed
- **THEN** the history lists 05-10-2026 – 11-10-2026 first

#### Scenario: Open a past review
- **WHEN** the user taps a review in the history
- **THEN** its score, reflection and plan are shown in full

#### Scenario: Work of a past week
- **WHEN** the user opens the review of the week starting 2026-09-28, in which 3 entries were logged on "Thesis"
- **THEN** the page lists "Thesis" with 3 entries in that week's summary

#### Scenario: Show all
- **WHEN** 8 reviews are completed
- **THEN** the history panel lists the latest 5, and "Show all" lists all 8

## REMOVED Requirements

### Requirement: Review tab
**Reason**: Replaced by "Review tab layout": the review button moves into the header and the summary, plan and history become panels of a dashboard.
**Migration**: None; everything the old requirement listed is still on the Review tab.
