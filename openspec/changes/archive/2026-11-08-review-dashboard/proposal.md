# Proposal

## Why

The Review tab stacks its parts in one 800 px column: the plan, then goals, time, the days, done work, habits and history. Seeing a week means scrolling through all of it, and a maximised window stays half empty. The parts themselves are right; only their arrangement is wrong (docs/SPEC.md §6.5). The approved mock ("Orbit Design Overhaul", section 4) arranges them as a dashboard that fits one screen.

## What Changes

- **Header:** "Review", the week switcher (‹ CW 45 · 2–8 Nov ›, "This week" when another week is shown) and the Start / Continue / Edit weekly review button. The button moves up from below the summary and names its review week in its tooltip.
- **Summary figures:** a row of five figures:
  - time worked (against the weekly target when set)
  - daily average
  - time on goals
  - habits kept, as kept of due across all habits with the share
  - done, as completed tasks and finished projects
- **Dashboard grid:** on a window wide enough (content width from 1100 px), a 12-column grid:
  - goals (7 columns) next to the plan for the week (5)
  - time by area / goal / project (5) next to the recent weeks (7)
  - the days across the full width
  - habits, done this week and the history in three equal columns
  
  Panels side by side always have the same height. Narrower windows stack the panels into one column in this order.
- **Goals panel:** each goal with its progress bar (with the week's gain), its change and its work in the week. Below each goal, only the measures that changed during the week appear ("7 → 9 / 20 +2"). Unchanged measures stay on the goal page.
- **Days panel:** the seven day timelines (calendar-like, as today) across the full width, each day headed with its hours.
- **History panel:** the latest 5 completed reviews (week and score), with "Show all" to list every review in the panel.
- **The same layout everywhere the summary appears:** the Review tab, a past review's page (below its reflection, plan and notes) and step 1 of the guided review (which gets the width it needs).

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `week-summary`:
  - Adds "Dashboard layout" and "Summary figures".
  - "Work by day" adds the hours to each day's heading.
  - "Goals and their change in the week" lists only changed measures and comes after the figures.
  - "Time worked in the week" folds into the figures.
- `weekly-review`:
  - "Review tab" gets the header with the review button and the dashboard.
  - "Review history" becomes a panel with the latest 5 and "Show all".

## Impact

- **Code:**
  - `src/features/review/ui/`: `ReviewScreen`, `WeekSummaryView` (split into panels), `TimeSection`, the flow's step 1 and `ReviewHistoryPage`, with their CSS
  - `src/features/review/domain/week-summary.ts`: the habits and done figures
  - `src/features/timeline/ui/WeekTimeline.tsx`: hours in the day headings and a scroll height
- **Data:** no change; the figures come from the existing summary.
- **Docs:** `docs/SPEC.md` §6.5.

## Out of scope

- The new palette, type sizes, sidebar and other "native look" fixes from the mock. They come with the following changes, so the dashboard uses today's colours and type for now.
- The guided review's other steps, the phone (the review is not on the phone) and new figures beyond the five.
