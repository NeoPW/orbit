# Tasks

## 1. Data

- [x] 1.1 In `src/features/home/data/home-queries.ts`, change `listActiveProjects` so each item has `tasks` (the first 3 open tasks in `sortOpenTasks(…, { nextStepsFirst: true })` order) and `openCount` (all open tasks) in place of `nextSteps`. Update the existing test in `src/features/home/data/home-queries.test.ts` and cover the "Next steps first" and "More than three tasks" scenarios; verify with `npx vitest run src/features/home/data`.
- [x] 1.2 In the same file, add a `more` list next to To do: open tasks of active projects that are not next steps, ranked like `listTodo` (rank, then project order), as `TodoItem`s. Test the "Expand" and "Paused project stays hidden" scenarios in `home-queries.test.ts`; verify with `npx vitest run src/features/home/data`.

## 2. Project cards

- [x] 2.1 In `src/features/home/ui/HomeScreen.tsx`, render the card's `tasks` as checkbox rows (completing via `useCompleteTask`, which already handles Undo and the next-step prompt) and a "+N more" link (`openCount - tasks.length`) that opens the project detail; style it in `HomeScreen.module.css` with theme tokens. Verify with `npx tsc --noEmit` and in the app (2 rows, 3 rows, 5 rows → "+2 more").

## 3. To do expansion

- [x] 3.1 In `HomeScreen.tsx`, load the `more` list with the Home data and add the "Show N more" / "Show less" toggle below the To do list (collapsed by default, hidden when `more` is empty), rendering the expanded tasks with the same row component as To do. Verify in the app, including with an empty ranked list.
- [x] 3.2 In `HomeScreen.tsx`, make the To do keyboard highlight run over the ranked tasks plus the expanded tasks while expanded (J/K, arrows, 1–9, Space/X/Enter), and clamp the highlight when the section collapses. Verify with the "Keys reach the expanded tasks" scenario in the app (no unit test: the keys are UI wiring over an existing handler).
- [x] 3.3 Add a `todo-more` action (`A`, group Home, "Show more / fewer tasks") in `src/app/shortcuts/keys.ts` with a matching case in `src/app/shortcuts/keys.test.ts`; handle it in `HomeScreen.tsx` (toggle, nothing while the section is hidden) and show "(A)" in the toggle's tooltip. Verify with `npx vitest run src/app/shortcuts` and in the app ("Expand and collapse with A", the `?` overlay lists it).

- [x] 3.4 Review fix: in `HomeScreen.tsx`, move the toggle directly below the ranked list and above the expanded tasks, so it stays in place; show a chevron (down collapsed, up expanded) and the number instead of text, keeping "Show N more" / "Show less" as its accessible name and tooltip (with "(A)"); adjust `HomeScreen.module.css`. Verify with `npx tsc --noEmit` and in the app.
- [x] 3.5 Review fix: `A` did nothing because `todo-more` was missing from `SCREEN_ACTIONS` in `src/app/shortcuts/ShortcutProvider.tsx`; add it. Verify in the app ("Expand and collapse with A").

## 4. Verification

- [x] 4.1 Check the change in the desktop app (`npm run desktop`) and in the browser (`npm run dev`), including the phone width (< 640 px) for the To do expansion.
- [x] 4.2 Run `npm run check` and fix any failures.
