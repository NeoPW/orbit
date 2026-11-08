# Tasks

## 1. Server

- [x] 1.1 Add `POST /api/reminder-check` (`server/src/reminder-check.ts`, routed in `server/src/api.ts` with token and schema version), answering `{ needed }` for a habit and date, a task or a project.
  - Verify: `npx vitest run server` with tests for the scenarios of "Reminder check".

## 2. Android plugin

- [x] 2.1 Spike: create the plugin (inline: `src-tauri/src/reminders.rs` and Kotlin in the Android app module, see design), registered on Android only.
  - Prove three things on the emulator: an alarm notification 1 minute ahead with the app closed; its tap opening a route on a cold and a warm start (`takeLaunchRoute` / `tap`); the permission prompt.
  - Record the findings in `design.md`.
  - Verify: `npm run android` builds and the three checks pass on the emulator.
- [x] 2.2 Complete the Kotlin side:
  - `schedule` stores the list and server settings and replaces the alarms (exact when allowed)
  - `ReminderReceiver` does the check with a 5 s timeout and fails open
  - the "Reminders" and "Focus" channels
  - `showOngoing` / `clearOngoing`
  - `BootReceiver`
  - the manifest permissions and receivers
  - Verify: "After a restart" and "Offline" on the emulator; "Checked on the desktop" against the local server (`npm run server:dev`).
- [x] 2.3 Extend `src/platform/notify.ts` with the Android calls (behind `platform === 'android'`): schedule, ongoing, permission, launch route and tap event into `onNotificationClick`. The desktop and browser paths are unchanged.
  - Verify: `npx vitest run src/platform`, including the key → id mapping (stable, positive, not 1–9).

## 3. App side

- [x] 3.1 Return each reminder's kind and target from `planReminders`, and add `AndroidReminderRunner` (`src/features/notifications/ui/`): a 7-day replace-all plan without `review:`, with checks and the server settings. It runs at start, on resume, after writes and syncs, and at midnight, debounced. `src/app/AppRoot.tsx` renders it instead of `ReminderRunner` on Android.
  - Verify: pure tests that the plan has no review reminders, keeps the focus end with reminders off, and builds the checks; then "Habit reminder while closed", "Checked on the phone" and "Reminders switched off" on the emulator.
- [x] 3.2 Add the ongoing focus notification from `getTimerView` ("Running since HH:mm" / "Paused · N min").
  - Verify: a test of the text, and the scenarios of "Ongoing focus notification on Android" on the emulator.
- [x] 3.3 Handle taps on the phone in `src/app/useNotificationClicks.ts`: `/tasks/<id>` → Home plus the task popup, `/projects/<id>` → Home, `/focus` and `/home` as they are. Move the hook inside the providers.
  - Verify: "Tap a task reminder on the phone" on the emulator.
- [x] 3.4 Handle the permission (at start while reminders are on, and when switched on) and show the switch, the default reminder time and the lead time on Android in `ReminderSettings.tsx`, with the "blocked" note.
  - Verify: "First start", "Denied" and "Settings on the phone" on the emulator; the browser still shows its note.

## 4. Docs and verification

- [x] 4.1 Update `docs/SPEC.md`:
  - §7: the reminder check
  - §8: Android reminders, check before showing, ongoing notification, taps, permission and the per-device switch
  - §9: Android notifications done
  - Also update the `openspec/config.yaml` context line.
- [x] 4.2 Run `npm run check`.
- [x] 4.3 With the user's go-ahead, deploy the server (`npm run server:deploy`) and run the smoke test. (Deployed; the authenticated reminder check is confirmed on the phone in 4.4.)
- [x] 4.4 Build the APK (`npm run android:build -- --target aarch64`), install it on the phone and check:
  - a habit reminder with the app closed
  - one suppressed after checking the habit on the desktop
  - the ongoing notification
  - a tap on a task reminder
  - the desktop still reminds
