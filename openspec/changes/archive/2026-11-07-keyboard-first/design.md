# Design

## Context

The only keyboard handling today is local: Escape in `FocusMode`, arrow keys inside `Select`, `Menu`, `SegmentedControl` and the focus field. Sheets (`TaskSheet`, `LogWorkSheet`, `ProjectSheet`, `GoalSheet`, `HabitSheet`, `AreaSheet`) are opened by local state in each screen, so there is no way to open one from outside a screen. Sheets and dialogs are native `<dialog>` elements opened with `showModal()`, which already return focus to the element focused before them on close.

## Goals / Non-Goals

**Goals:** one place that decides which key does what, testable without a browser; sheets and the palette openable from anywhere; no change for users who never press a shortcut.

**Non-Goals:** a shortcut registry that screens extend at run time; customisable keys; a system-wide hotkey.

## Decisions

### One table and a pure matcher

`src/app/shortcuts/keys.ts` holds the shortcut table (key, label, group, action id) — the overlay, the tooltips and the palette read it, so a key is written down once. `matchShortcut(event, context)` takes a plain object (`key`, `shiftKey`, `ctrlKey`, `altKey`, `metaKey`, and whether the target is editable or a dialog is open) and returns an action id or null. It is unit-tested; the DOM part only fills the context (`target.closest('input, textarea, select, [contenteditable], [role=combobox]')` and `document.querySelector('dialog[open], [role=menu]')`).

`event.key` is used (not `code`), so `?`, `+` and `-` work on any keyboard layout; `Shift+H` matches `key === 'H'` with `shiftKey`.

Alternative: a hotkey library. Rejected: the table is small and the "not while typing or in a dialog" rule is the only real logic; a library would add a package for it.

### Global listener and an app-level sheet host

`ShortcutProvider` in `Shell` adds one `keydown` listener on `window` and runs global actions: navigation through `navigate`, sheets through `AppSheets` — a small context with `open(kind)` (`task | log | project | goal | habit | area`) that renders the one open sheet next to the screen. The palette, the overlay and the shortcuts all call `AppSheets.open`. Screens keep their own sheets for their own buttons; only the global entry points use the host.

`F` with no session navigates to Home and requests focus: a tiny event bus (`requestFocusField()` / `onFocusFieldRequest`) the focus panel subscribes to, because the field may only mount after navigation.

### Screen-local keys

- **Home To do:** `HomeScreen` keeps the highlighted index (state, reset when the list changes length or on a click elsewhere) and handles `J`/`K`/arrows/`Space`/`X`/`Enter`/`1`–`9` through the same matcher with a "home" context. `TaskRow` gets a `highlighted` prop (outline in the project colour, `aria-selected`) and the row scrolls into view. `X` uses the existing `useCompleteTask`, so Undo and the next-step prompt behave as for the checkbox.
- **Focus mode:** `FocusMode`'s existing listener grows into the focus-mode context of the matcher. `TimeLimit` gets an `openRef`/`open` prop so `L` can open its menu; `+`/`−` compute the new limit with a pure `stepLimit(limit, workedMs, ±5)` in `timer/domain`.

### Palette

`src/features/palette/`: `entries.ts` builds the entry list from plain data (projects, goals, open tasks, active habits, themes, session state, sync connected) — pure and tested, including the filter (`every word contained, ignoring case`, max 50, the free-text "Focus: <text>" entry last). `CommandPalette.tsx` is a `<dialog>` with a text field and a listbox (`role="listbox"`, `aria-activedescendant`); it loads its data with one `useLiveQuery` when opened. Running an entry calls the same functions the UI uses: `navigate`, `AppSheets.open`, `useStartFocus().start`, the quick-start plan of Home's field for free text, the session actions (`pauseTimer`, `resumeTimer`, the complete dialog via navigating to focus mode and opening it), `saveSetting('theme')`, `useSync().syncNow`.

"Complete" and "Set time limit" open focus mode with an intent (`/focus` plus a request through the same small bus as the focus field), so the complete dialog and limit menu live in one place.

### Tooltips

`Button` has no tooltip prop; the shortcut goes into its `title` ("New task (T)"). `IconButton` and the sidebar already have tooltips; their text gets the key from the table.

## Risks / Trade-offs

- [Arrow keys on Home no longer scroll the page while no field is focused] → acceptable on Home, which is short; other screens keep scrolling.
- [Space on a focused button also clicks it] → the matcher ignores keys whose target is a button or link for `Space` and `Enter`, so the native action wins there.
- [WebKitGTK (Tauri on Linux) and `event.key` for `?`] → `?` arrives as `key === '?'` with Shift; verified in the desktop app as a task.
