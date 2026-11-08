# Tasks

## 1. Key matching

- [x] 1.1 `src/app/shortcuts/keys.ts`: add `keyboardFocus: boolean` to `KeyInput`; `matchShortcut` returns a new global action `release-focus` for `Escape` when `keyboardFocus` is set (before the scope keys), and a new Home action `todo-clear` for `Escape` in the `home` scope. Add both to `SHORTCUTS` (Global: "Esc — Take the focus off a button or link"; Home: "Esc — Clear the highlight").
- [x] 1.2 `src/app/shortcuts/keys.test.ts`: `Escape` with `keyboardFocus` gives `release-focus` in every scope (also `detail` and `focus`); without it, `home` gives `todo-clear`, `detail` still `go-back`, `focus` still `focus-leave`; nothing over a dialog.

## 2. Wiring

- [x] 2.1 `src/app/shortcuts/ShortcutProvider.tsx`: `keyInput` sets `keyboardFocus` when the active element is not `body`, not a field and matches `:focus-visible` (false if the selector throws); handle `release-focus` by blurring the active element; add `todo-clear` to `SCREEN_ACTIONS`.
- [x] 2.2 `src/features/home/ui/HomeScreen.tsx`: handle `todo-clear` with `setHighlight(null)`.

## 3. Verify

- [ ] 3.1 Desktop app (`npm run desktop`, WebKitGTK) and browser (`npm run dev`): Home `2` then `Esc` clears the highlight; `Tab` to a button on Plan then `Esc` removes the ring and `Shift+H` works; in focus mode clicking Pause then `Esc` leaves; on a project page `Tab` + `Esc` + `Esc` releases, then goes back.
- [x] 3.2 Run `npm run check` once.
