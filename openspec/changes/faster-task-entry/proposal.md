# Proposal

## Why

Entering and moving through tasks still takes more clicks than it should. Assigning a new task to a project means opening the "Assigned to" dropdown, although the focus panel already understands `title # project`. In "What's the next step?", picking an open task needs the mouse and two clicks (a checkbox, then Complete), because the cursor starts in the new-task field. And forms can only be saved with Enter from a single-line field: from notes or another multi-line field, the user has to reach for Save.

## What Changes

- **`#` in the New task title:** when creating a task (desktop sheet and phone quick-add), typing `#` in the title suggests the active projects, as the focus panel does (docs/SPEC.md §6.1, Focus panel). Picking one moves it into "Assigned to" and leaves only the title in the field. Text saved with an unpicked `# name` is read the same way as in the focus panel: a unique match assigns the project; otherwise the form shows "No project named …" and does not save. Editing an existing task does not read `#`.
- **Next-step prompt from the keyboard and with one click** (SPEC §5, Next steps): when the project has other open tasks, the prompt opens with the first one highlighted. The arrow keys move through the tasks and up into the new-task field. Enter or a click on a task picks it and completes right away. Ctrl+click or Ctrl+Enter, or the task's checkbox, adds the task to a selection instead, so several can be picked. Typing a letter goes to the new-task field. Skip, Cancel and the new-task field stay.
- **Shift+Enter saves every form** (SPEC §6.7, "Enter saves forms"): in every sheet and in the dialogs that hold a form, Shift+Enter saves from any field, including multi-line text areas, where Enter still adds a new line.
- **Importance is not mentioned:** the New task and phone quick-add requirements are restated without importance. This depends on the parallel change `manual-task-order`, which removes importance from tasks and projects. **Apply this change after `manual-task-order`.** Both changes modify "Create a task from Home" (home) and "Quick add task" (mobile-layout). The importance part of the text matches, so archive `manual-task-order` first and rebase these two MODIFIED blocks on its result if its wording differs.

Out of scope:
- `#` for goals; only active projects are suggested, as in the focus panel.
- `#` when editing a task, and in the Plan tab's other create forms (project, goal).
- Shortcuts in the prompt other than those above (for example a key for Skip).
- The order of the prompt's tasks: this change keeps the project's task order, whatever `manual-task-order` makes it.
- Notes that save themselves as they are typed (Today's note, weekly notes) and the command palette: they are not forms.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `tasks`: a new requirement for reading `# project` in the New task title; a new requirement for picking in the next-step prompt with the keyboard and one click.
- `home`: "Create a task from Home" is restated without importance and with `#` in the title.
- `mobile-layout`: "Quick add task" is restated without importance and with tappable `#` suggestions.
- `keyboard-shortcuts`: a new requirement that Shift+Enter saves a form.

## Impact

- `src/features/tasks/ui/TaskSheet.tsx`: the title becomes a field with project suggestions when creating.
- `src/features/timer/domain/quick-start.ts` (parsing reused; possibly moved to a shared place) and `src/features/timer/ui/QuickStartField.tsx` (the suggestion popup, reused or factored out).
- `src/features/tasks/ui/NextStepPrompt.tsx` (+ CSS): a list with a highlight, keys and a selection.
- `src/core/ui/components/Sheet.tsx`, plus the form dialogs `CompleteDialog.tsx`, `NextStepPrompt.tsx`, `TimeLimit.tsx` (custom limit), `SessionScreen.tsx` (set form) and `SyncPanel.tsx` (connect form): Shift+Enter.
- `src/app/shortcuts/ShortcutOverlay.tsx`: lists Shift+Enter.
- No schema change, no new packages, no sync impact.
