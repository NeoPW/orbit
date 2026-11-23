# Design

## Context

- The focus panel already reads `title # project`. The parsing is pure and tested: `parseQuickStart`, `matchProjects` and `resolveProject` in `src/features/timer/domain/quick-start.ts`. Its suggestion combobox (the arrows, Enter, Tab, Escape and popup placement) is built into `src/features/timer/ui/QuickStartField.tsx`.
- Every task form is `TaskSheet` (`src/features/tasks/ui/TaskSheet.tsx`). That includes the phone quick-add, which is the same sheet shown full screen.
- `Sheet` saves on Enter in a single-line field through its `<form onSubmit>`. The other forms (`CompleteDialog`, `NextStepPrompt`, `TimeLimit`'s custom field, `SessionScreen`'s set form, `SyncPanel`) each have their own `<form>`.
- There are no component tests (Vitest runs in `node`). UI behaviour is checked by hand; pure logic is tested in `domain/`.

## Goals / Non-Goals

**Goals:**
- One combobox implementation for the focus panel and the task title.
- Shift+Enter handled in one place, so new forms get it without extra code.

**Non-Goals:**
- Changing how the focus panel behaves.
- Component-test infrastructure (jsdom, Testing Library).

## Decisions

1. **A pure `parseNewTaskTitle(text, projects)` in `src/features/tasks/domain/tasks.ts`.** It returns `{ title, projectId }` (with `projectId` null without `#`) or `{ error: 'No project named …' }`, built on `parseQuickStart` and `resolveProject`, which are imported from the timer domain. Features already import each other's modules (TaskSheet uses the projects and goals repositories), so moving the parser to `core/` would only be churn. The function is unit-tested; `TaskSheet` only carries out the result. It is used only when there is no `task` prop (creating).

2. **Extract a core `SuggestionField`** (`src/core/ui/components/SuggestionField.tsx`): an input with a suggestion popup that takes `{ key, label, hint, color, choose }` items and has the current keys. `QuickStartField` becomes a thin wrapper that builds its items; `TaskSheet`'s title builds project items only while the text has `#`. Copying the ~80 lines of combobox code was the alternative, but two copies would drift apart in keyboard behaviour. The cost is a refactor of the focus panel field, which task 2.3 checks by hand.

3. **Shift+Enter is one document-level `keydown` listener** (`src/app/shortcuts/useShiftEnterSubmit.ts`, mounted in `ShortcutProvider`). The key test is a pure `isFormSubmitKey(event)` in `src/app/shortcuts/keys.ts`, tested in `keys.test.ts`, with a `SHORTCUTS` entry "Save a form" for the overlay. On `Enter` with Shift and without Ctrl, Alt or Meta (and not while composing), it takes `event.target.closest('form')`, finds its first enabled `button[type=submit]` and calls `form.requestSubmit(button)`. It does nothing without a form or with every submit button disabled. This covers sheets, dialogs and in-screen forms alike, and future ones too. The alternative, an `onKeyDown` on each form, needs six edits and is easy to forget on a new form. It must not depend on `defaultPrevented`, so comboboxes (`SuggestionField`) treat only a plain Enter as "pick" and leave Shift+Enter alone. Date and time fields already apply a valid value while typing (`ParsedTextField` calls `onChange` as soon as the text parses), so no extra parsing step is needed before submitting. Auto-saving note fields are not in a `<form>` and are unaffected.

4. **The next-step prompt's list is a focusable `listbox` (`aria-multiselectable`)** that uses `aria-activedescendant` for the highlight. It receives the focus when there are candidates. Each row has a checkbox, which toggles the selection, and the title; a click on the title picks the task. A click on the row picks it, Ctrl+click toggles it, Enter picks the highlighted task plus the selection, and Ctrl+Enter toggles. Up from the first row focuses the new-task field; down from the field focuses the list. A printable key (one character, no Ctrl, Alt or Meta) on the list focuses the field and appends the character. The existing rule stays: typing clears the selection and selecting clears the typed title. The `NextStepChoice` contract with `CompleteTaskProvider` does not change (`{ kind: 'pick', taskIds }`). The candidates keep the order `listOpenTasksOfProject` returns.

## Risks / Trade-offs

- [`requestSubmit` bypasses a form's own disabled check if it has no submit button] → only forms with an enabled `type=submit` button are submitted; forms without one are skipped.
- [The suggestion popup on the phone can sit under the on-screen keyboard] → check placement in the Android app or a narrow browser window; if `usePopoverPlacement` does not flip above, place it using `visualViewport` (task 2.4).
- [A task title that really contains `#` (for example "Fix issue #12") is read as a project when creating] → the same trade-off the focus panel already makes. "No project named 12" makes it visible, and editing the task afterwards keeps `#`. This is listed as an open question in the final report.
- [Refactoring `QuickStartField` could change the focus panel] → the existing `quick-start` tests cover the parsing; the keys are checked by hand (task 2.3).
