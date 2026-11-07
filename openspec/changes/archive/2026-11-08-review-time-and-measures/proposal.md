# Proposal

## Why

The week summary lists work per project only as entry counts and durations, so it doesn't show at a glance how much was worked, where the time went (by area, goal or project) or how the week compares with earlier weeks. Measure changes are also shown only in percentage points since the last saved review. The summary can't show that a measure went from 7 to 9 out of 10 this week, because the app keeps only a measure's current value. Moving between weeks is limited to a separate "Last week" page with no way back to the current week (docs/SPEC.md §6.5, §5 "Weeks", "Progress").

## What Changes

- **Week switcher on the Review tab:** ‹ week › buttons and "This week" in the header switch the Review tab's summary to any past week. The week is kept in the address (`/review?week=yyyy-mm-dd`). **BREAKING:** the separate "Last week" page and its button are removed.
- **Time section in the week summary:** it appears wherever the summary is shown (Review tab, guided review step 1, history).
  - **Stat tiles:**
    - total time worked, with the weekly hour target when one is set ("15 h 44 min / 20 h", "79 % of target")
    - daily average, over the days of the week up to today
    - share of time spent on goals
  - **Time by area, goal or project:** a switch between the three, one coloured bar per item, unassigned time as "Other". It **replaces** the "Work" list (counts per project grouped by goal).
  - **Recent weeks:** total per week for the 8 weeks ending at the shown week, with a 4-week average line and the 4-week average as a headline.
- **Plan of the shown week:** each week shows the plan written in the review of the week before (old plans are kept in the reviews).
- **Calendar weeks:** weeks are named "CW 45" everywhere, with the date range beside it where there is room.
- **Weekly hour target:** a new local setting, off by default.
- **Measure value history:** every change of a numeric or yes/no measure's value is recorded in a new synced table, `measure_changes`, with the value before and after. From it, the value at any moment can be derived.
- **The week's change in the Goals section:** this **replaces** "since the previous review".
  - Each measure shows its value at the start and end of the week, for example "7 → 9 / 10 km" with "+2". Yes/no measures show "Achieved" when they were achieved during the week. Habit measures show check-ins, for example "12 → 15 / 30 check-ins", counted from the check-in dates.
  - Each goal shows its change in percentage points over the week.
  - Changes made before the history existed show no change.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `week-summary`:
  - Removes "Work per project" and replaces it with the time section: stat tiles, time by area/goal/project and recent weeks.
  - Replaces "Goals in the summary" (change since the previous review) with goals showing the week's change from value history.
- `weekly-review`:
  - The Review tab gets the week switcher and shows the plan only for the current week.
  - "Last week page" is removed.
- `measures`: adds "Value history".
- `settings`: adds "Weekly hour target".

## Impact

- **Schema:**
  - new synced table `measure_changes`
  - app migration `drizzle/0004_*`, server migration `server/migrations/0004_*`, `SCHEMA_VERSION` 5
  - The server must be redeployed, and the phone needs a new APK to keep syncing.
- **Code:**
  - `src/core/db/schema.ts`, `server/src/schema.ts`
  - `src/features/goals/data/measures-repository.ts`: writes the history.
  - `src/features/review/` (domain, loader, `WeekSummaryView`, `ReviewScreen`); `LastWeekPage` is removed.
  - routes (`review` takes `week`, `review-last-week` is removed)
  - `src/features/settings/` (target setting and screen)
  - example data
- **Dependencies:** none new; the bars and the trend chart are plain SVG/CSS.
- **Docs:** `docs/SPEC.md` §4 (MeasureChange, the target setting), §5 ("Weeks", "Progress"), §6.5 (Review tab, summary contents).

## Out of scope

- Per-day hour bars (the Days timelines stay as they are).
- Keyboard keys for switching weeks.
- Showing a past week's plan, score or reflection on the Review tab (the history page has them).
- Back-filling measure history for changes made before this change.
- Charts beyond 8 weeks (longer-term stats, score trends, habit streaks).
- Editing or listing the history of a measure.
