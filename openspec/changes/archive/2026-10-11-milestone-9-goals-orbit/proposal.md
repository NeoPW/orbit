# Proposal

## Why

The app is used as a project and work tracker. The OKR structure gets in the way of that:
- **Too much hierarchy:** objectives and key results are two layers between a project and what it is for. Projects hang under a KR, KRs have their own pages, and you can't see at a glance which goals your work serves.
- **The review is about KRs:** it shows KR progress and work per project, but not how each goal moved or which projects were finished that week.

At the same time, the space-theme experiment on `experiment/space-theme` (dark only, Hubble backgrounds, star systems, app icon) was well received, but it is built on objectives and KRs and was never specified.

`docs/SPEC.md` was rewritten for this as milestone 9 (§1, §3, §4, §5, §6.1–§6.7, §7, §8, §9).

## What Changes

**Goals instead of objectives** (SPEC §3, §4 Goal, §6.4)
- Objectives are renamed to **goals**, with the same dates, status, order and color.
- **Projects serve a goal** (`goal_id`). Tasks, habits and log entries can also be assigned to a goal.
- **Goal page:**
  - a header with the goal's planet, title, progress, dates, status chip and deadline badge
  - its measures, updated right in the row
  - the projects serving it, its tasks and habits
  - the work logged on it this week and in total.
- A project without own deadline inherits its goal's end date.

**Measures instead of key results** (SPEC §3, §4 Measure, §5 Progress, §6.4) — **BREAKING**
- **Key results are no longer an entity.** A goal has several **measures**:
  - number with start, target and step
  - yes/no
  - habit check-ins.
- **No measure page:** measures are added, updated and edited on the goal page (− / + buttons and direct value entry, a done switch, read-only habit check-ins). The KR page and KR routes go away; old KR links open the goal page.
- **Goal progress** is the average of its measures.
- **Dropped:** KR deadlines and KR colors.

**Moving existing data** (SPEC §4 "Moving from objectives and key results", §7)
- On update, local data moves over, keeping every ID:
  - objectives become goals and KRs become measures of their goal
  - links to a KR move to its goal
  - KR snapshots become measure snapshots
  - completed projects get a completion date.
- `supabase/schema.sql` migrates the server the same way. It runs before the first sync of the new version; older app versions stop syncing.

**Weekly review around goals** (SPEC §5 Weeks, §6.5)
- **Week summary:**
  - goals with progress and the change since the last completed review, their measures, and the work on each goal
  - work per project grouped by goal
  - projects and tasks finished that week
  - habits.
- **Projects get a completion date** so the week they were finished in is known.
- The guided review's KR step becomes **Goals**: update each active goal's measures.

**Orbit identity** (SPEC §6.1, §6.6, §6.7) — formalizes and adapts the experiment
- **Dark only**, a daily **Hubble background** behind every screen, translucent cards and bars, opaque sheets, **Space Grotesk** headings.
- **One solar system on Plan (large) and Home (compact):**
  - a sun (you)
  - the active goals as labeled planets in their color, brighter with progress and ringed when all measures are reached
  - their active projects as moons in area colors
  - projects without a goal as loose asteroids.
- **Goal colors:** pickable in the goal form (space palette or Auto).
- **Shooting star:** crosses the Home header when the last habit of the day is checked.
- **Settings › Space images:** all photos with credits (CC BY 4.0); pin one, or a new one each day.
- **Brand:** new app icon (with an Android adaptive icon) and dark launch screens on Android and the web.
- **Sheets** open above the tab bar and keep clear of the phone's navigation bar.
- **Replaced experiment parts:** the per-objective star systems, KR planets and KR colors.

**Out of scope**
- Statistics (score trends, time per goal over months).
- A measure history beyond the weekly review snapshots.
- Measure deadlines or measure reminders.
- Light mode.
- Animated space visuals (only the one-off shooting star).
- Desktop-native builds.

## Capabilities

### New Capabilities
- `goals`: goals and their lifecycle: create, edit, delete, color, deadline badge, progress, the goal page, and the work counted per goal.
- `measures`: a goal's measures: the three types and their fields, progress, recording progress from the goal page, step, edit and delete.
- `solar-system`: the one solar system, large on Plan and compact on Home: sun, goal planets, project moons, asteroids for projects without a goal, labels and taps.

### Modified Capabilities
- `objectives`: retired; all requirements move to `goals`.
- `key-results`: retired; all requirements move to `measures` (no page, no deadline).
- `plan-overview`: goals list with measures and projects, "Projects without a goal", archive of goals, entry points without KRs, goal page in the detail pane.
- `home`: solar system and shooting star, habits labeled by goal, upcoming deadlines without KRs, project cards with their goal, tasks assigned to a goal.
- `projects`: link to a goal instead of a KR, deadline inherited from the goal, completion date.
- `project-detail`: shows the goal it serves; inherited deadline from the goal.
- `tasks`: assignment to a project or goal; log entries go to the task's goal.
- `habits`: link to a project and/or goal; deleting a habit leaves habit measures without a habit.
- `work-timer`: a stopped task timer logs to the task's project or goal.
- `notifications`: no KR deadline reminders; recompute on goal and measure changes.
- `weekly-review`: Goals step instead of key results; snapshots of measures.
- `week-summary`: goals with progress change, work grouped by goal, finished projects.
- `visual-design`: dark only, Space Grotesk headings, space background, translucent surfaces, sheets above the tab bar, brand icon and launch screens, forms for goals and measures.
- `settings`: Space images screen; the pinned image is a local setting.
- `app-shell`: dark theme only; old objective and KR URLs redirect.
- `local-database`: goals, measures and measure snapshot tables, goal links, project completion date, migration from objectives and KRs.
- `sync`: server tables for goals and measures, server migration, older versions stop syncing.

## Impact

- **Database:** drift schema v7 with a data migration from v6, plus `supabase/schema.sql` with a re-runnable server migration. Your phone (already at v6) and the Supabase project are migrated on update.
- **Code:**
  - `lib/features/objectives` and `lib/features/key_results` are replaced by `lib/features/goals` (goals and measures)
  - touched: plan, home, projects, tasks, habits, log, timer, review, reminders, router, `lib/core/space`, theme and settings
  - the space experiment code is adapted.
- **Tests:** existing objective/KR tests move to goals/measures; migration tests for v6 → v7; new tests for the solar system, goal page and review summary.
- **Sync:** the server schema must be updated before the new app version syncs. Old app versions cannot sync after that.
- **Dependencies:** no new packages.
