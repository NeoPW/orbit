# Tasks

Phase A removes importance and the automatic ranking (groups 1–4). Phase B adds Home's own drag order (groups 5–7). Phase A leaves Home's To do in time-added order, so the app is usable between the phases.

## 1. Phase A — Domain without importance

- [x] 1.1 In `src/features/projects/domain/projects.ts` remove `urgency`, `projectScore`, `compareByScore`, `sortByScore` and the importance comparator in `compareForPlan`; add one project comparator (effective deadline, none last, then `createdAt`) used for Home and Plan. Update `projects.test.ts`: scenarios home "Deadline first", "Tie broken by time added" and plan-overview "Project ordering"; `npx vitest run src/features/projects/domain` passes
- [x] 1.2 In `src/features/tasks/domain/tasks.ts` remove `DEFAULT_IMPORTANCE`, `effectiveImportance`, `taskRank`, `rankDate`, `compareByRank` and `applyProjectOrder`; change `sortOpenTasks`' fallback to `createdAt` only. Update `tasks.test.ts`: tasks "Order" and "New task after a manual order"; `npx vitest run src/features/tasks/domain` passes

## 2. Phase A — Data layer

- [x] 2.1 `src/core/db/schema.ts`: mark `projects.importance` and `tasks.importance` as deprecated and unused in a comment (no schema change); verify `npm run db:generate` reports no changes
- [x] 2.2 `src/features/tasks/data/tasks-repository.ts`: drop `importance` from task input/views and `projectImportance`; update `resetTaskOrder`'s doc comment; callers `CommandPalette.tsx`, `FocusPanel.tsx`, `review/data/next-step.ts` stop passing `importance`. `tasks-repository.test.ts` and `next-step.test.ts` updated, incl. tasks "Reset" (time-added order); tests pass
- [x] 2.3 `src/features/projects/data/projects-repository.ts`: drop `importance` from create/update inputs and Plan sorting (use the new comparator); `projects-repository.test.ts` updated; tests pass
- [x] 2.4 `src/features/home/data/home-queries.ts`: To do and "Show N more" without rank; To do by `createdAt` for now; "Show N more" grouped by the side column's project order and each project's open task order; active projects by the new comparator. `home-queries.test.ts`: home "Time added" and "Order of the expanded tasks"; tests pass
- [x] 2.5 `src/features/settings/data/example-data.ts` and `src/features/timeline/data/timeline-loader.test.ts`: remove importance values; `npx vitest run src/features/settings src/features/timeline` passes

## 3. Phase A — UI without importance

- [x] 3.1 `TaskSheet.tsx`, `TaskDetails.tsx`, `TaskRow.tsx`: remove the importance field, dots and "inherited" marker (task page and popup); check the task page and popup show no dots (tasks "No importance")
- [x] 3.2 `ProjectSheet.tsx`, `ProjectPage.tsx`, `ProjectRow.tsx`, `ProjectTasksSection.tsx`, `plan/ui/BacklogSection.tsx`, `plan/ui/ProjectsWithoutGoalSection.tsx`: remove the importance field and dots; project form shows no importance field
- [x] 3.3 `review/ui/ProjectsStep.tsx`: remove the importance control; the step still edits status, next steps, deadline and note
- [x] 3.4 `HomeScreen.tsx`: To do rows without dots; delete `src/core/ui/components/ImportanceDots.tsx` and its entry in `src/app/dev/ComponentGallery.tsx`; `grep -rn -i importance src` only finds the deprecated schema columns

## 4. Phase A — Checkpoint

- [x] 4.1 `npx tsc --noEmit` and `npx vitest run src/features/tasks src/features/projects src/features/home src/features/review` pass

## 5. Phase B — Home position column

- [ ] 5.1 Add `homePosition: real('home_position')` (nullable, comment like `sortOrder`) to tasks in `src/core/db/schema.ts`; run `npm run db:generate` (new `drizzle/0009_*.sql` adding only the column) and `npm run db:generate:server` (new file in `server/migrations/`); verify both SQL files contain just the `ALTER TABLE`
- [ ] 5.2 Confirm `home_position` is pushed and pulled by sync (`src/features/sync/data/push.ts` and pull); add a case to the existing sync round-trip test if columns are listed explicitly; test passes

## 6. Phase B — Home order logic

- [ ] 6.1 `src/features/tasks/domain/tasks.ts`: add `sortTodo` (positioned by `homePosition`, then the rest by `createdAt`) and `hasHomeOrder`; tests for home "Time added" and "New task goes to the end"; `npx vitest run src/features/tasks/domain` passes
- [ ] 6.2 `tasks-repository.ts`: generalize the position-writes helper over the column; add `moveTodoTask(db, clock, id, toIndex)` (first move positions the whole To do list in one batch, later moves write one row, renumber when too close). Tests: home "Drag a task up" (order survives reload) and "Independent of the project order"; tests pass
- [ ] 6.3 `setNextStep`: when To do has a manual order, give the newly marked task `homePosition = max + 1` in the same batch. Test: home "New next step goes to the end"; tests pass
- [ ] 6.4 `home-queries.ts`: list To do with `sortTodo`; adjust `home-queries.test.ts`; tests pass

## 7. Phase B — Home drag UI

- [ ] 7.1 `HomeScreen.tsx`: To do rows get a drag handle with `Alt+↑/↓` through the same `onMove` mechanism as `TaskList` (`src/features/tasks/ui/TaskRow.tsx`), wired to `moveTodoTask`; "Show N more" rows have no handle. Check in the browser (`npm run dev`): drag C above A, reload, order kept; `Alt+↑` on a focused handle moves the task and keeps focus (home "Keyboard")
- [ ] 7.2 Check that the To do list keys (`J`/`K`, `1`–`9`) still work alongside the handles, and on the phone layout (narrow window) that handles can be dragged by touch

## 8. Verification

- [ ] 8.1 `npm run check` passes
- [ ] 8.2 Verify in the desktop app (`npm run desktop`) and the browser (`npm run dev`): no importance anywhere (forms, Home, project detail, Plan, review, task popup), projects ordered by deadline then time added, project task lists by time added with Reset order, Home To do drag order kept after reload
- [ ] 8.3 Verify sync with the local server (`npm run server:dev`): reorder To do on one client, sync the other, same order (home "Synced")
- [ ] 8.4 Update docs/SPEC.md (§3, §4 Project/Task fields, §5 remove "Project score" and "Task rank", add the To do order, §6.1, §6.2, §6.3, §6.5, §6.7) and note that at archive the `projects` spec Purpose must drop "an importance" and the `home` spec Purpose "in order of score"
