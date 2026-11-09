# Proposal

## Why

First-week feedback: there is no place to jot down thoughts for the day. Weekly notes belong to a project or goal and are written in the review. A free note for today, right on Home, is missing.

## What Changes

- New: one **daily note** per local calendar day, a free text field on Home directly under the focus panel (desktop and phone), labeled "Today's note".
- The note is saved while typing, without a save button (as weekly notes are), and an emptied note is deleted.
- Outline editing: Enter continues a `- `, `* ` or `- [ ] ` list line (an empty marker line ends the list), Tab / Shift+Tab indent and outdent list lines.
- Basic Markdown: while the field is not focused, the note shows formatted (headings, nested bullets, checkboxes, bold, italic, inline code). Clicking it edits the text, and clicking a checkbox ticks it. A small renderer of our own, building React elements (never HTML), so no new package is needed.
- `N` on any screen goes to Home and puts the cursor in the note.
- At midnight, or when the app comes back on a later day, Home shows that day's note (empty for a new day); earlier notes stay stored.
- Daily notes are synced like the other records. The same day's note written on two devices ends up as one note, and the later edit wins.
- New synced table `daily_notes` on the device and the server, with an ID derived from the date. This needs a new migration on both sides and a server deploy before devices sync (the existing schema-version check enforces that).

Relevant sections of docs/SPEC.md: §3 Core concepts, §4 Data model (Note), §6.1 Home, §6.7 phone layout, §7 Sync.

### Out of scope

- Reading past daily notes anywhere (history, weekly review, Today screen). Notes are stored per day, so this can be a later change.
- Markdown beyond that subset (links, tables, numbered lists, images), formatting while typing, and search.
- Showing an edit from another device while the note field is open (it is read when Home opens or the day changes, so typing is never overwritten).

## Capabilities

### New Capabilities

- `daily-notes`: one free note per calendar day, saved as written, one record per day across devices, with outline editing and a formatted view.

### Modified Capabilities

- `home`: the layout gets "Today's note" under the focus panel, and Home shows the current day's note.
- `mobile-layout`: Home on the phone also shows the note under the focus panel.
- `local-database`: the schema gains the DailyNote table, and its `id` is derived from the date.
- `sync-server`: the server holds a `daily_notes` table too.
- `keyboard-shortcuts`: a new global key, `N`, for the daily note.

## Impact

- `src/core/db/schema.ts` (new `daily_notes` columns, table and `SYNCED_TABLES` entry), new migration in `drizzle/` and in `server/migrations/`, `server/src/schema.ts`.
- New `src/features/daily-notes/` (repository, pure outline and Markdown functions with tests, the note field and formatted view).
- `src/app/shortcuts/keys.ts`, `requests.ts`, `ShortcutProvider.tsx` (the `N` key).
- `src/features/home/ui/HomeScreen.tsx`.
- Release: run `npm run server:deploy` before devices on the new version sync, and update the Android app too.
- `docs/SPEC.md` §3, §4, §6.1 and §6.7 need a short update at archive.
