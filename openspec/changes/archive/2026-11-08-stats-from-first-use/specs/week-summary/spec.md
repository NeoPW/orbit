## MODIFIED Requirements

### Requirement: Recent weeks
The summary SHALL show the total time worked in each of the 8 weeks ending with the summarized week, as bars labelled with the total and the week's dates. The summarized week SHALL be highlighted, and the current week SHALL be marked "so far". A week before the week of the first-use date (see stats, "All time") SHALL show no bar.

The summary SHALL also show a line of the 4-week average: for each week, the average of that week and the 3 weeks before it, leaving out weeks before the week of the first-use date. The current week SHALL get no point on this line, and neither SHALL a week before the week of the first-use date.

As a headline, the summary SHALL show the 4-week average of the summarized week, or of the 4 weeks before it when the summarized week is the current week. When all of those weeks are before the week of the first-use date, it SHALL show no average.

#### Scenario: Eight weeks
- **WHEN** the summary of the week of 2026-11-02 is shown
- **THEN** bars for the weeks from 2026-09-14 to 2026-11-02 are shown, the last one highlighted

#### Scenario: Current week headline
- **WHEN** the current week is shown and the 4 weeks before it had 40 h, 32 h, 50 h and 30 h
- **THEN** the headline 4-week average is 38 h per week, and the current week's bar is marked "so far"

#### Scenario: Weeks without work
- **WHEN** nothing was logged in one of the 8 weeks, after the week of the first-use date
- **THEN** that week is shown with 0 and counts as 0 in the averages

#### Scenario: Weeks before first use
- **WHEN** the first-use date is 2026-10-21, the current week of 2026-11-02 is shown and the weeks of 2026-10-19 and 2026-10-26 had 10 h and 20 h
- **THEN** the weeks from 2026-09-14 to 2026-10-12 show no bar, and the headline 4-week average is 15 h
