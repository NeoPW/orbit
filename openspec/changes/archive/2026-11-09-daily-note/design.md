# Design

## Context

Weekly notes already live in the `notes` table, keyed by target type, target and week, with a natural-key UUID v5 ID. Sync is driven by `SYNCED_TABLES` (`src/core/db/sync-tables.ts` derives the column lists for push, pull and the server), and the server rejects devices on another schema version (`SCHEMA_VERSION` = number of app migrations).

## Decisions

### A new `daily_notes` table, not a row type in `notes`

`notes` has `target_type`, `target_id` and `week_start`. A daily note has no target and a date instead of a week. Storing it there would mean a fake target and a date in `week_start`. A note dated on a Monday would then also turn up in that week's past review (`listNotesForWeek`). A separate table keeps both queries simple.

Schema (`src/core/db/schema.ts`, in `columns` like the other synced tables):

| column | type | notes |
|---|---|---|
| shared | `id`, `created_at`, `updated_at`, `deleted_at` | as every synced table |
| `date` | text, not null | local calendar date `yyyy-mm-dd` |
| `note` | text, not null, default `''` | trimmed text |

- Unique index `daily_notes_date` on `date`.
- `id` = `naturalId('daily_note', date)` (a new `NaturalKind` in `src/core/db/records.ts`), the same helper the weekly notes use. The same day written on two devices is one row, and last-write-wins settles it.
- Added to `SYNCED_TABLES` as `daily_notes`, so push, pull and the server schema test pick it up.

### Migrations

- App: `npm run db:generate` → `drizzle/0006_*.sql` (`CREATE TABLE daily_notes` + unique index). This is a new migration; applied ones stay untouched.
- Server: add `dailyNotes` to `server/src/schema.ts` (columns + `server_seq` + index), then `npm run db:generate:server` → `server/migrations/0006_*.sql`.
- `SCHEMA_VERSION` goes from 6 to 7. A device on 7 and a server on 6 refuse each other ("different schema version") until `npm run server:deploy` has run. That is the existing, documented release order.

### Saving the field

The daily note field follows `NoteField`: it reads the stored note once per date, saves 500 ms after typing stops, on blur and on unmount, and saves an empty text as a soft delete. It is keyed by the date, so when `useToday()` changes, the pending text is flushed to the old date and the new date's note is loaded. It does not re-read while open, so a synced edit from another device never overwrites typing. The cost is that such an edit shows only after Home is opened again (out of scope, see proposal).

### Outline editing

Pure functions in `src/features/daily-notes/domain/outline.ts` take `(text, selectionStart, selectionEnd)` and return the edit to apply (`{ start, end, insert, caret }`) or `null` (then the key does its default):
- `onEnter`: continue or end a list line (marker regex `^(\s*)([-*] \[[ xX]\] |[-*] )`). The cursor must be at the end of the line; otherwise Enter acts normally.
- `onTab(shift)`: indent or outdent the cursor's line by two spaces, only on list lines.

The field applies an edit by selecting the range and calling `document.execCommand('insertText', …)`. Writing `value` from React would wipe the browser's undo history. `execCommand` is deprecated but works in WebKitGTK, Chromium and the Android WebView, so Ctrl+Z also undoes the outline edits. If it returns false, the field falls back to setting the value directly, which loses undo but keeps the edit.

### Formatted view

`src/features/daily-notes/domain/markdown.ts` parses the note into a small tree: blocks (heading level 1–3, list item with depth and optional `checked` plus the source line index, paragraph line), each holding inline spans (text, bold, italic, code). Unclosed markers stay text. `DailyNoteView.tsx` renders the tree as React elements (`h3`–`h5`, one row per bullet indented by depth, `Checkbox`, `strong`, `em`, `code`), so the text is never parsed as HTML and no `dangerouslySetInnerHTML` is used. A checkbox click calls `toggleCheckbox(text, lineIndex)` (also in `markdown.ts`) and saves at once. The view is a focusable group (`tabIndex=0`; it can't be a button because it holds checkboxes), and a click outside the checkboxes or Enter on it switches to the text field.

Hand-written instead of a library (`marked`, `markdown-it`): we need a tiny subset, safe output as React elements, and checkbox line mapping. Libraries emit HTML strings that would need sanitizing, and line mapping isn't built in.

### The `N` key

A global `daily-note` action in `src/app/shortcuts/keys.ts` (group Global), handled in `ShortcutProvider` like `focus-field`: navigate to Home, then `dailyNoteRequest.request()` (new in `requests.ts`). `DailyNoteField` subscribes, switches to the text field and puts the cursor at the end.

No new packages.

## Risks

- **Sync gap during rollout:** devices updated before the server stop syncing until the deploy. Deploy the server first, then update the desktop, the browser build (deployed together with the server) and the Android app.
