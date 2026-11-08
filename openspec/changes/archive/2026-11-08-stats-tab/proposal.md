# Proposal

## Why

The weekly review shows one week and the eight before it, but there is no way to see longer-term trends: whether hours, review scores, habits and focus on goals are getting better over months. The spec has listed stats as the next milestone (docs/SPEC.md §9 item 7, §6.5 "Later: longer-term stats"). This change is the first of several stats changes and lays the ground the others build on: a Stats tab, calendar periods and the trends.

## What Changes

- New top-level destination **Stats** (`/stats`) in the sidebar after Review, desktop only, with the shortcut `Shift+S` and a "Stats" entry in the command palette. **BREAKING:** Settings moves from `Shift+S` to `Ctrl+,`.
- A **period picker** in the header: month, quarter, year or all time, with ‹ › to step to the previous or next period, the current month by default. The period is kept in the address.
- **Headline figures** for the period: time worked, daily average, average review score, habit adherence and share of time on goals. The four rates are compared with the previous period of the same kind.
- **Trends**: four small charts (hours, review score, habit adherence, share on goals), with one point per week for a month or quarter and one per month for a year or all time.
- Weekly figures (score, habit adherence) belong to the period that contains the week's Thursday; time is counted by the date of each entry.

Planned follow-up changes, each proposed on its own: `stats-habits-calendar` (habit streaks and calendars, the year calendar of work, the weekday × hour heatmap), `stats-time-tasks` (where time goes, project totals, tasks done, time to done), `stats-goals` (goal progress over time, projected finish).

**Out of scope:** custom date ranges; moving "Recent weeks" out of the Review tab; stats on the phone; any of the follow-up changes above; a stats-specific hour target (the weekly hour target is not shown here).

## Capabilities

### New Capabilities
- `stats`: the Stats tab, its periods, headline figures and trends over weeks and months.

### Modified Capabilities
- `app-shell`: four top-level destinations instead of three, with Stats after Review, and the `/stats` address.
- `keyboard-shortcuts`: `Shift+S` goes to Stats, `Ctrl+,` to Settings.
- `command-palette`: Stats among the "Go to" entries.
- `mobile-layout`: Stats is not reachable on the phone.

## Impact

- New feature folder `src/features/stats/` (data loader, pure domain functions, UI).
- `src/core/routing/routes.ts` (route, section, address), the sidebar and the screen switch in `src/app/`, `src/app/shortcuts/keys.ts`, the command palette's go-to entries.
- Reuses the week helpers in `src/features/review/domain/` and the habit expectation logic; charts are plain SVG like the Review's recent-weeks chart, no new packages.
- `docs/SPEC.md` gets a Stats section and the milestone note updated.
