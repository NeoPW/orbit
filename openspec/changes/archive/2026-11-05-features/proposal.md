# Proposal

## Why

Milestone 4 left the app as an empty shell: Home, Plan and Review show empty states, and only Settings → Sync works. This change is milestone 5 (`docs/SPEC.md` §9): every feature of the rebuilt app, so the desktop app and the browser build replace the previous app in daily use.

By decision it is one change, far above the usual size limit (about 5 delta specs and 15 tasks). To keep it workable:
- the task groups are ordered by dependency, and the app works after each group;
- apply can stop after any group and continue in a later session.

## What Changes

- **Data layer:**
  - Repositories per feature, on Drizzle.
  - A live-query hook, so every screen updates after any local write or sync (§6, "updates live" in the specs).
- **Shared components (second set):**
  - fields: date, time, number, select, switch, checkbox, color picker, weekday picker;
  - a menu, for status chips and overflow actions;
  - a progress bar and list rows;
  - short list animations.
- **Detail pages with their own paths:**
  - `/goals/:id`, `/projects/:id`, `/tasks/:id`;
  - review pages (`/review/flow`, `/review/history/:id`, `/review/last-week`).
- **Areas (§4, §6.4):** a list in Plan, with create, edit and delete.
- **Goals and measures (§4, §5 Progress, §6.4):**
  - Goal form and goal page: header, measures with − / + / value / done controls, projects, tasks and habits, work, weekly notes.
  - Goal colors are swatches, not planets.
  - Measures use progress bars, not rings.
- **Projects and project detail (§6.2):**
  - project form, status chip, deadline from the goal;
  - next steps, open tasks, habits, weekly notes, log entries.
- **Tasks (§4 Task, §5 Next steps, §6.3):**
  - Own importance (or inherited) and several next steps per project, as a flag on the task.
  - The "What's the next step?" prompt only on completing the last open next step; it can pick several tasks.
  - Task page.
- **Habits (§5 Habits):** a list in Plan, a habit form, checking and unchecking.
- **Work log (§5, §6.1):**
  - "Log work" with optional duration and note, then the project or task.
  - Log entries on detail pages; delete entries.
  - The quick log's "Start timer" mode is removed; starting a timer moves to the focus panel.
- **Timer and focus (§5 Timer and focus, §6.1):**
  - Focus panel on Home: choose a task or project and a planned length (25, 50, 90 or open-ended), start, Stop, Discard; live elapsed time and overtime.
  - Full-window focus mode.
  - Stopping asks "What did you get done?".
- **Home (§6.1):**
  - today's weekday and date, focus panel, habits due today as chips;
  - "To do" ranked by task rank (§5);
  - a side column with the active projects by score and their next steps;
  - New task and Log work.
  - Removed: the solar system, "Upcoming deadlines", the floating buttons, the today progress ring and the shooting star.
- **Plan (§6.4):** one page with sections:
  - goals with measures, projects and tasks;
  - projects without an active goal;
  - backlog (area filter, Activate);
  - habits, areas and archive;
  - a create menu (goal, project, task, habit).
  
  Detail pages open as pages, not in a second pane; the More sheet is removed.
- **Weekly review (§6.5):**
  - default view, guided flow, history and last week;
  - the projects step also changes next steps, importance and deadline, and takes a weekly note;
  - the goals step changes status and measures, and takes a weekly note;
  - the save step stores measure snapshots.
- **Weekly notes (§4 Note):** one note per project or goal and week, written in the review, shown newest first on the project and goal pages and with the past review.
- **Settings (§6.6):** reminders switch, default reminder time, review day and time, deadline lead time (it replaces `DEFAULT_LEAD_DAYS` everywhere), next to Sync.
- **Desktop notifications and tray (§8):**
  - habit, deadline and weekly-review reminders while the app runs;
  - a notification and a sound at the end of a planned focus session;
  - clicking a notification opens its screen;
  - closing the window keeps Orbit in the tray.
  
  The browser build shows none.
- **BREAKING (spec):**
  - single next step → several next steps;
  - quick log with timer mode → Log work plus focus panel;
  - Android notifications → desktop notifications;
  - Plan's More sheet and two-pane layout → sections and pages;
  - Home's deadlines section and solar system removed.

## Capabilities

### New Capabilities

- `weekly-notes`: one note per project or goal and week; written in the review, listed on project and goal pages and with past reviews.

### Modified Capabilities

- `app-shell`: detail pages and review pages get their own addresses; a missing item shows "not found".
- `app-platforms`: closing the desktop window keeps Orbit running in the tray.
- `visual-design`:
  - measure progress as bars (no orbit rings);
  - pages instead of two panes on wide screens;
  - list rows and menus.
- `areas`: the area list is a section of Plan.
- `goals`: color swatches instead of planets, the badge text from visual-design, goal page sections including weekly notes, live updates without planets.
- `measures`: progress bars instead of rings on the goal page.
- `projects`:
  - next steps become flagged tasks (the next-step text field is removed);
  - creating a project no longer mentions moons.
- `project-detail`: several next steps marked in the task list; a weekly notes section.
- `tasks`:
  - task importance;
  - marking and unmarking several next steps;
  - the prompt only after the last next step, picking one or more tasks;
  - task page actions (focus session, mark/remove next step).
- `habits`: the habit list is a section of Plan.
- `work-log`: "Log work" without timer mode; log entries show the timer source.
- `work-timer`:
  - starting from the focus panel, a task row or the task page, with a planned length;
  - the stop note;
  - focus panel and focus mode replace the timer card.
- `home`:
  - new layout (focus panel, habits, To do ranked by task rank, active projects in a side column);
  - deadlines section, solar system, today ring, shooting star and floating buttons removed.
- `plan-overview`: sections instead of the More sheet and two panes, a goals section without planets, a create menu.
- `weekly-review`: the projects step and the goals step also cover next steps, importance, deadline, goal status and weekly notes.
- `settings`: reminders are a desktop feature (the browser note changes).
- `notifications`: desktop notifications while the app runs (instead of Android), a focus session end notification with a sound, no ongoing timer notification, no key-result leftovers.

## Out of scope

- The solar system: SPEC §10 keeps it as an idea. Its spec stays as a brief, and nothing in this change shows it.
- Space photo background, translucent surfaces and the Space images setting (as in app-shell).
- Manual reordering of tasks, goals, areas and measures. New items go last; the sort order is kept.
- Stats (§6.5 "Later"), the Android companion, Windows/macOS builds.
- Habit-measure progress before a goal's start date, and other edge cases not in the specs.
- Schema changes: the schema from `local-database` already has every column this change needs.

## Impact

- **Code:**
  - New: `src/features/{areas,goals,measures,projects,tasks,habits,work-log,timer,home,plan,review,notes,settings,notifications}/` (data, domain, ui).
  - More components in `src/core/ui/` and a live-query hook in `src/core/db/`.
  - More routes in `src/core/routing/`.
  - The placeholder screens and `TestAreas` are replaced.
- **Desktop (`src-tauri/`):**
  - tray icon (Tauri `tray-icon` feature);
  - close-to-tray;
  - notifications with click handling (`notify-rust`);
  - more capabilities.
- **Dependencies:** `notify-rust` (Rust). No new npm package.
- **Docs:**
  - `docs/SPEC.md` §6.4 ("detailed layout is designed in its own change") and §9;
  - `README.md` (using the app, tray);
  - the `app-shell` and `visual-design` Purpose lines left over from the last archive.
