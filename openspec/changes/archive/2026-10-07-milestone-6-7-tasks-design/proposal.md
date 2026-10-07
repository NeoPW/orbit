# Proposal

## Why

Two things hold the app back in daily use.
- **Tasks are second-class:** they only exist inside projects, mostly as next steps. There's no way to capture a quick to-do from Home, give it a deadline, attach it to a KR or objective, or log work on it.
- **The app looks and feels like a default template:** grey lists of text lines ("Importance 3 · No area · No deadline"), items shown twice on one screen, settings hidden behind a menu, and a cramped stepper for the weekly review.

`docs/SPEC.md` was updated for both: milestone 6 (tasks and navigation) and milestone 7 (design refresh), §3–§6.7. This change implements the two together, so the new task screens are designed in the new style from the start.

## What Changes

**Milestone 6: tasks and navigation** (SPEC §3, §4, §5, §6.1–§6.4, §6.6, §8)
- **Tasks as their own items:**
  - A task stands alone or is assigned to exactly one project, key result or objective.
  - It has notes and its own deadline, which it doesn't inherit.
  - It can be reopened after completion.
  - Deleting a KR or objective unlinks its tasks (they become standalone); deleting a project still deletes its tasks.
- **Task page** (`/tasks/:id`):
  - title, notes, deadline, status, assignment (tappable) and a next-step marker
  - complete with Undo, reopen, edit, delete, log work
  - the task's log entries.

  It opens from Home, the project detail, Plan, the review summary and deadline reminders.
- **Work on tasks:** log entries get a `task_id`.
  - Completing a task logs it with its task link.
  - Quick log lists active projects and open tasks outside projects.
  - The task page has "Log work".
- **Home:**
  - a **Tasks** section below the active projects: open tasks outside projects, by deadline
  - a **new-task button on the left** (a sheet with title, deadline and assignment), with quick log on the right.
- **Plan:**
  - "New task" in the create menu
  - open tasks assigned to a KR or an objective are listed under it
  - project tasks open their task page from the project detail.
- **Settings everywhere:** a settings button in the top bar of Plan, Home and Review. Settings becomes a root-level route; Plan's menu keeps Archive, Habits and Areas.
- **Reminders:** deadline reminders cover open tasks outside projects too, and a task reminder opens the task page.

**Milestone 7: design refresh** (SPEC §6.1, §6.2, §6.5, §6.7)
- **Visual identity:** a space-inspired palette.
  - Deep "night sky" navy surfaces in dark mode, light lavender-grey surfaces in light mode.
  - A luminous blue-violet primary, a cyan secondary and an amber "urgency" color.
  - Area colors as accents.
  - **Inter** bundled as the app font, with a tuned type scale and spacing.
  - Progress shown as **orbit rings**.

  A logo and app icon are a later branding step.
- **Less text, more structure:**
  - chips, icons and badges instead of text lines: importance as dots, status as a colored chip, deadline badges colored by urgency
  - absent values left out instead of "No area" / "No deadline"
  - empty states with an icon, one line and an action.
- **Home as a dashboard:**
  - a header with the date and today's progress (habit ring, tasks due today)
  - habits as tappable chips
  - upcoming deadlines only for KRs and tasks inside projects, because projects and other tasks carry their badge on their card
  - project cards with the next step as a checkbox.
- **Detail pages:**
  - a header with title, status chip, area chip and deadline badge
  - the status changed through the status chip instead of a row of large buttons
  - the next step marked in the task list instead of shown twice.
- **Weekly review as full-screen pages** with a progress bar and Back / Next, instead of the Material stepper.
- **Motion and wide screens:**
  - list items animate in and out
  - detail pages open with a fade-through transition
  - at desktop width (≥ 1000 px) Plan shows the list and the selected project or task side by side.

## Capabilities

### New Capabilities
- `visual-design`: The app-wide visual language: palette and themes, typography, chips and badges instead of text lines, empty states, motion, and the two-pane Plan layout.

### Modified Capabilities
- `tasks`: assignment to project, KR or objective; the task page; reopen; log work on a task; creation from Home and Plan; unlink when the assignment is deleted.
- `home`: dashboard header, habit chips, deadlines only for items without their own card, project card next-step checkbox, Tasks section, new-task button.
- `work-log`: quick log lists open tasks outside projects; entries can belong to a task.
- `project-detail`: header with chips, status through the status chip, next step marked in the task list, tasks open their task page.
- `plan-overview`: tasks under their KR or objective, "New task", settings button instead of a menu entry, two-pane on wide screens.
- `weekly-review`: the guided review as full-screen pages with a progress bar.
- `settings`: reachable from the top bar of Plan, Home and Review.
- `notifications`: deadline reminders for tasks outside projects; task reminders open the task page.
- `app-shell`: the theme is the Orbit palette with Inter.
- `local-database`: schema version 4 (task assignment columns, `task_id` on log entries).
- `week-summary`: completed tasks show what they were assigned to and open their task page.

## Impact

- **Data:** schema version 3 → 4, adding columns only:
  - `tasks.key_result_id`, `tasks.objective_id`
  - `log_entries.task_id`.

  This is a drift step-by-step migration with tests. `supabase/schema.sql` gains the same columns (`alter table … add column if not exists`), and **the user re-runs it in the SQL Editor** before syncing with the new version.
- **Code:**
  - `lib/core/theme/` (new palette, text theme, component themes) and `lib/core/widgets/` (chips, badges, orbit ring, empty state, animated list, two-pane scaffold)
  - task feature (repository, task page, quick-create sheet)
  - Home, project detail, Plan, Review flow, quick log, router, reminders.
- **Assets:** the Inter font files (OFL licence) under `assets/fonts/`, declared in `pubspec.yaml`.
- **Dependencies:** none. Inter is bundled; animations use Flutter's built-in widgets.
- **Tests:** many widget tests that look for exact texts ("No area", "Status: Active", the stepper) change with the new UI.

## Out of scope

- **Logo, app icon and other branding** (a later step in the space direction).
- **Create/edit in bottom sheets, swipe actions, and Undo instead of confirmation dialogs.** Not chosen: forms stay full-screen except the new quick-create task sheet, and deletes keep their confirmation.
- **Importance or area on tasks, and task scoring.** Tasks stay lean.
- **Reordering tasks manually** (still deferred).
- **Statistics and native desktop builds** (milestone 8).
