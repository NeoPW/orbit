# Tasks

Apply after `manual-task-order` (TaskSheet no longer has importance then).

## 1. Shift+Enter saves a form

- [x] 1.1 Add `isFormSubmitKey(event)` (Enter with Shift, no Ctrl, Alt or Meta, not composing) and a `SHORTCUTS` entry `Shift+Enter` "Save a form" (Global) in `src/app/shortcuts/keys.ts`; test both in `src/app/shortcuts/keys.test.ts` (`npx vitest run src/app/shortcuts`).
- [x] 1.2 Add `src/app/shortcuts/useShiftEnterSubmit.ts`: a document `keydown` listener that, for `isFormSubmitKey`, takes `target.closest('form')` and calls `requestSubmit` with its first enabled `button[type=submit]` (nothing otherwise). Mount it in `src/app/shortcuts/ShortcutProvider.tsx`. Verify by hand: Shift+Enter in the New task notes saves, Enter there adds a line, and Shift+Enter with an invalid due date saves nothing.
- [x] 1.3 Check the other forms by hand: the complete dialog (`CompleteDialog.tsx`), the custom time limit (`TimeLimit.tsx`), a workout set (`SessionScreen.tsx`), the sync connection (`SyncPanel.tsx`) and the next-step prompt each submit with Shift+Enter; the overlay (`?`) lists "Save a form".

## 2. `#` in the new task title

- [x] 2.1 Add `parseNewTaskTitle(text, projects)` to `src/features/tasks/domain/tasks.ts`, built on `parseQuickStart` and `resolveProject`. Cover the "Project typed in the new task title" scenarios in `src/features/tasks/domain/tasks.test.ts`: unique prefix, unknown project, and no `#` (`npx vitest run src/features/tasks/domain`).
- [x] 2.2 Extract `src/core/ui/components/SuggestionField.tsx` (input, suggestion popup, arrows, Enter or Tab to pick, Escape closes; a plain Enter only, leaving Shift+Enter alone) from `src/features/timer/ui/QuickStartField.tsx`, and rebuild `QuickStartField` on it.
- [x] 2.3 Check the focus panel by hand after the refactor: the suggestions, Tab completion, arrows with Enter, Esc twice, `# port` project suggestions and the "No project named …" error still behave as before (`npx vitest run src/features/timer`).
- [x] 2.4 In `src/features/tasks/ui/TaskSheet.tsx`, when creating, use `SuggestionField` for the title with the active projects after `#`. Picking sets "Assigned to" and strips `# …` from the title; saving runs `parseNewTaskTitle`, shows its error under the title or uses the project it found. Editing keeps the plain text field. Verify the scenarios "Suggest projects", "Pick a project", "Editing keeps the #" and "Overrides the preselected project" by hand, and on the phone layout (a narrow browser window or `npm run android`) that the suggestions are visible above the keyboard and can be tapped.
- [x] 2.5 Add the `#` hint to the New task part of `docs/SPEC.md` §6.1 ("Also on Home: **New task** …"); verify the text matches the home delta.

## 3. Next-step prompt

- [x] 3.1 Rebuild the candidate list in `src/features/tasks/ui/NextStepPrompt.tsx` (+ `NextStepPrompt.module.css`) as a focusable multi-select listbox. It has a highlight (first task on open, focused when there are candidates), up and down moving it and into the new-task field and back, Enter picking the highlighted task plus the selection, Ctrl+Enter toggling, a click on a row picking it and Ctrl+click or its checkbox toggling, and a printable key moving into the field with that character. Verify every "Next-step prompt from the keyboard" and "Pick a next step with one click" scenario by hand on Home, the project detail and after a focus session.
- [x] 3.2 Update `docs/SPEC.md` §5 "Next steps" with the one-click and keyboard picking; verify the text matches the tasks delta.

## 4. Final verification

- [x] 4.1 Run `npm run check` (typecheck, lint, all tests) and make sure it passes.
- [x] 4.2 Verify the change in the desktop app (`npm run desktop`) and in the browser (`npm run dev`): a new task with `# project`, the next-step prompt from the keyboard only, and Shift+Enter in a sheet and in the complete dialog.
