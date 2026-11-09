# Tasks

## 1. Schema and migrations

- [x] 1.1 Add the `dailyNotes` columns, the `daily_notes` table with the unique index `daily_notes_date`, its type and the `daily_notes` entry in `SYNCED_TABLES` in `src/core/db/schema.ts`; add `'daily_note'` to `NaturalKind` in `src/core/db/records.ts`. Run `npm run db:generate` (new `drizzle/0006_*.sql`, never touching applied ones). Update `src/core/db/migrate.test.ts` (fresh install: 14 entity tables + settings at version 7) and add the "Unique daily note per day" insert-rejected case there; verify with `npx vitest run src/core/db`.
- [x] 1.2 Add `dailyNotes` (columns + `server_seq` + index) to `server/src/schema.ts` and run `npm run db:generate:server` (new `server/migrations/0006_*.sql`). Add the "Daily notes round trip" case to `server/src/pull.test.ts` (or the push/pull test that holds the goal round trip); verify with `npx vitest run server/src`, where `schema.test.ts` also checks that the columns match.

## 2. Repository

- [x] 2.1 Create `src/features/daily-notes/data/daily-notes-repository.ts` with `getDailyNote(db, date)` and `saveDailyNote(db, clock, date, text)`: natural ID, drop leading blank lines and trailing whitespace (keep the first line's indentation), upsert, soft delete for an empty or blank text. Test it in `daily-notes-repository.test.ts`: "Change the note", "Empty note", "Only spaces", "Next day", the deterministic ID ("Two devices") and a kept first-line indent. Verify with `npx vitest run src/features/daily-notes`.

## 3. Outline and Markdown (pure)

- [x] 3.1 Create `src/features/daily-notes/domain/outline.ts` (`onEnter`, `onTab`) with `outline.test.ts` covering "Continue a bullet", "Continue a checkbox", "End the list", "Indent and outdent", "Plain line" and Enter in the middle of a line (null). Verify with `npx vitest run src/features/daily-notes/domain`.
- [x] 3.2 Create `src/features/daily-notes/domain/markdown.ts` (`parseNote`, `toggleCheckbox`) with `markdown.test.ts` covering "Headings, bullets and emphasis", nested depth, checkboxes with their line index, unclosed markers staying text, "HTML stays text" (kept as a text span) and "Tick". Verify with `npx vitest run src/features/daily-notes/domain`.

## 4. Note field and view

- [x] 4.1 Create `src/features/daily-notes/ui/DailyNoteField.tsx`: a labeled multi-line `TextArea` "Today's note" that loads the note for its `date` prop once, saves 500 ms after typing, on blur and on unmount, and flushes before loading a new date (the pattern of `src/features/notes/ui/NoteField.tsx`; reuse its delay constant). Enter and Tab call `onEnter` / `onTab` and apply the edit with `execCommand('insertText')` (fallback: set the value). Verify with `npx tsc --noEmit` and in the app (Ctrl+Z undoes a continued bullet).
- [x] 4.2 Create `src/features/daily-notes/ui/DailyNoteView.tsx` (+ CSS module, theme tokens only), rendering `parseNote` as React elements, and switch between view and field in `DailyNoteField` (view when not focused and not empty; click or Enter edits with the cursor at the end; a checkbox click toggles and saves). Verify in the app with the "Headings, bullets and emphasis" note.
- [x] 4.3 Render `<DailyNoteField date={today} />` in `src/features/home/ui/HomeScreen.tsx` directly below `FocusPanel`, so it shows on the desktop and the phone. Verify in the app: type, switch to Plan and back (saved), clear it (gone), and the order on the phone.

## 5. Shortcut

- [x] 5.1 Add the global `daily-note` action (`N`, "Today's note") in `src/app/shortcuts/keys.ts` with a case in `keys.test.ts` (N matches on every screen, not while typing); add `dailyNoteRequest` in `src/app/shortcuts/requests.ts`, handle the action in `ShortcutProvider.tsx` (go to Home, then request) and subscribe in `DailyNoteField`. Verify with `npx vitest run src/app/shortcuts` and in the app ("From Plan").

## 6. Verification

- [x] 6.1 Check the change in the desktop app (`npm run desktop`) and in the browser (`npm run dev`), including the phone width (< 640 px), and sync between the two against the local server (`npm run server:dev`): the same day's note ends up as one.
- [x] 6.2 Run `npm run check` and fix any failures.
