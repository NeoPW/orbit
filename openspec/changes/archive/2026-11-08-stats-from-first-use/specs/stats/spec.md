## ADDED Requirements

### Requirement: Periods start at first use
Every period SHALL be cut at the first-use date (see "All time"): its days, time, tasks, goals and habits count from that date on, its weeks start with the week that contains that date, and its trends have no point for a week or month that ends before it. The comparison SHALL show no change when the previous period ends before the first-use date. Without a first-use date nothing SHALL be cut.

#### Scenario: Daily average from first use
- **WHEN** the first-use date is 2026-11-03, today is 2026-11-08 and 30 h were logged in November 2026
- **THEN** the daily average of November 2026 reads 5 h

#### Scenario: Weeks reviewed from first use
- **WHEN** the first-use date is Friday 2026-10-16 and the weeks of 2026-10-12, 2026-10-19 and 2026-10-26 have completed reviews
- **THEN** October 2026 shows "3 of 3 weeks reviewed"

#### Scenario: No trend points before first use
- **WHEN** the first-use date is 2026-09-10 and 2026 is shown
- **THEN** the trends have points from September on and none for January to August

#### Scenario: No comparison with a period before first use
- **WHEN** the first-use date is 2026-11-03 and November 2026 is shown
- **THEN** no change from October 2026 is shown

## MODIFIED Requirements

### Requirement: Periods
The user SHALL be able to choose the period kind: month, quarter (January–March, April–June, July–September, October–December), year or all time. ‹ and › SHALL step to the previous or next period of the same kind; › SHALL be disabled on the current period and ‹ on the period that contains the first-use date. The default SHALL be the current month. Switching the kind SHALL show the period of that kind that contains the start of the shown period, or the current one when it is the current period.

#### Scenario: Step back
- **WHEN** November 2026 is shown and the user presses ‹
- **THEN** October 2026 is shown

#### Scenario: No future periods
- **WHEN** the current quarter is shown
- **THEN** › is disabled

#### Scenario: Nothing before first use
- **WHEN** the first-use date is 2026-09-10 and September 2026 is shown
- **THEN** ‹ is disabled

#### Scenario: Switch kind
- **WHEN** October 2026 is shown and the user chooses quarter
- **THEN** Q4 2026 is shown

### Requirement: All time
The first-use date SHALL be the earliest date with a log entry, a habit check or a completed review. "All time" SHALL run from the first-use date up to today. Without any of them, it SHALL show the empty state.

#### Scenario: Start of all time
- **WHEN** the first log entry is on 2026-03-14 and nothing is earlier
- **THEN** "All time" covers 2026-03-14 to today
