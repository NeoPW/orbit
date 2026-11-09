# Proposal

## Why

First-week feedback: Home only shows a project's next steps, both in "To do" and on the active project cards. Showing only next steps in "To do" works, but the project cards then say little about what is left in a project, and there is no way to see the other open tasks from Home without opening each project.

## What Changes

- Active project cards on Home show up to 3 open tasks of the project in the project's own order (next steps first, then the other open tasks, as on the project detail), instead of only the next steps. When the project has more open tasks, a "+N more" link opens the project detail.
- Ticking a task on a card completes it; ticking the project's last next step still asks for a new next step.
- "To do" gets an expandable section below the ranked list: a compact toggle (a down chevron and the number of tasks) reveals the other open tasks of active projects (not next steps) below it, ranked by task rank, with the same rows as To do. The toggle stays in place and shows an up chevron while expanded, and using it again collapses the section. Its tooltip and accessible name are "Show N more" / "Show less". The section is collapsed when Home opens, and is hidden when there are no such tasks.
- While expanded, those tasks count as To do tasks for the keyboard keys (J/K, arrows, 1–9).
- `A` on Home expands or collapses that section. It is listed in the shortcut overlay, and the toggle's tooltip shows it ("Show 3 more (A)").
- Next-step tasks on the cards are not marked differently from other tasks. They come first, and Home keeps its low-noise look (docs/SPEC.md §6.7).

Relevant sections of docs/SPEC.md: §6.1 Home (To do, active projects), §5 Task rank, §5 Next steps.

### Out of scope

- The daily note on Home (the other first-week feedback item). It needs a new synced table and becomes its own change, `daily-note`.
- Tasks of paused or backlog projects. They stay off Home, also in the expanded section.
- Remembering whether the section was expanded across app restarts.
- Reordering tasks from Home.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `home`: active project entries show up to 3 open tasks with "+N more", any task on a card can be completed, and To do gets an expandable section with the other open tasks of active projects.
- `keyboard-shortcuts`: a new Home key, `A`, toggles To do's "Show N more" section.

## Impact

- `src/features/home/data/home-queries.ts`: `listActiveProjects` returns the first 3 open tasks per project (via `sortOpenTasks` with next steps first) and the open-task count; `listTodo` also returns the other open tasks of active projects, ranked.
- `src/features/home/ui/HomeScreen.tsx` (+ CSS module): card rows, "+N more" link, the expandable To do section and keyboard navigation over the visible rows.
- `src/app/shortcuts/keys.ts` (+ test): the `A` key in the Home group, which also puts it in the overlay.
- `docs/SPEC.md` §6.1 and §6.7 (keyboard shortcuts) need a short update (To do expansion, project cards, the `A` key), done at archive.
- No schema, sync or dependency changes.
