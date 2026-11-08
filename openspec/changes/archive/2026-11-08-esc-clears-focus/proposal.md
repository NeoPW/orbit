# Proposal

## Why

After highlighting a To do task with `1`–`9` (or `J`/`K`, the arrows) or moving to a button with `Tab`, there is no way to let go from the keyboard: `Esc` only leaves text fields (SPEC §6.7 keyboard; openspec keyboard-shortcuts "Leave a field with Esc"). The highlight or focus ring stays until the mouse clicks somewhere.

## What Changes

- On Home, `Esc` clears the To do or habit highlight.
- On every screen, `Esc` takes the keyboard focus off a button, link or other control (the focus shown with a ring after `Tab`), outside dialogs, sheets and menus.
- Only keyboard focus counts: a button that got focus from a mouse click (no ring) does not catch `Esc`, so `Esc` keeps going back or leaving focus mode as today.
- On detail pages and in focus mode, the first `Esc` releases the keyboard focus and the next one goes back or leaves focus mode, as with fields today.
- The shortcut overlay lists the new `Esc`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `keyboard-shortcuts`: new requirement "Esc releases keyboard focus"; "Esc goes back on detail pages" also waits for a control with keyboard focus.

## Impact

- `src/app/shortcuts/keys.ts` (+ test), `src/app/shortcuts/ShortcutProvider.tsx`, `src/features/home/ui/HomeScreen.tsx`.
- No schema, sync or SPEC changes (SPEC doesn't list Esc behaviour in detail).
- Out of scope: Esc inside dialogs, sheets and menus (unchanged); Android (no keyboard shortcuts there); moving focus anywhere after releasing it.
