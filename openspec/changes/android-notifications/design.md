# Design

## Context

- **Desktop:** `ReminderRunner` plans the day's reminders with the pure `planReminders(input, settings, from, until)` and shows each through a JS timer and `notify-rust`. This only works while the process runs.
- **Android:** the system freezes or kills the app in the background, and there's no WebView then, so no TypeScript runs. Reminders have to be handed to the system ahead of time, and anything decided at the moment a reminder is due has to be native code.
- **Sync:** the phone syncs only while open (start, resume, after writes). The server holds whatever the devices have pushed. The desktop pushes shortly after each change.

## Decisions

### 1. Our own Android plugin instead of the official notification plugin

- **Why:** the official plugin can schedule notifications but can't run code when they are due, so it can't do the check before showing. Since native code is needed anyway, one small plugin of our own handles all phone notifications. That gives one notification path on Android instead of two.
- **Layout (changed after the spike):** an inline plugin, not a separate crate.
  - `src-tauri/src/reminders.rs` registers the plugin "reminders" on Android only, with `register_android_plugin("dev.neopw.orbit.reminders", "RemindersPlugin")`.
  - Its Rust commands forward to explicitly named Kotlin methods with `run_mobile_plugin_async`, which avoids relying on how command names map to Kotlin.
  - `build.rs` declares the commands as a `tauri_build::InlinedPlugin` for the ACL, and `capabilities/mobile.json` allows `reminders:default` on Android.
  - The Kotlin classes live in the Android app module (`gen/android/app/src/main/java/dev/neopw/orbit/reminders/`), next to `MainActivity`.
  - The desktop doesn't load it and keeps `notify-rust`.
- **Commands** (`invoke('plugin:reminders|…', { payload })`):
  - `schedule`
  - `show_ongoing` and `clear_ongoing`
  - `permission_state` and `request_permission`
  - `take_launch_route`
  - There is no event: the app fetches the tapped route at start and on resume.
- **Kotlin parts:**
  - `RemindersPlugin`: the commands. It stores the list and the server settings in `SharedPreferences`.
  - `AlarmScheduler`: cancels the alarms it set before (ids from the stored list) and sets one alarm per reminder. It uses `setExactAndAllowWhileIdle` when `canScheduleExactAlarms()`, else `setAndAllowWhileIdle` (inexact, can be some minutes late).
  - `ReminderReceiver`: on an alarm it calls `goAsync()` and does the check (decision 3) on a background thread. If needed, it posts the notification on the "Reminders" channel, with a content intent to `MainActivity` that carries the route.
  - `BootReceiver`: on `BOOT_COMPLETED`, sets the stored future alarms again.
  - Ongoing notification: id 1 on a low-importance "Focus" channel, `setOngoing(true)`, with a content intent to `/focus`.
- **Manifest:** `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM` (the app is sideloaded, so the Play policy on it doesn't apply) and `RECEIVE_BOOT_COMPLETED`, plus the two receivers.

### 2. Replace-all scheduling over 7 days (TypeScript)

- `AndroidReminderRunner` is rendered instead of `ReminderRunner` on Android. It runs:
  - at start, on `visibilitychange` to visible, after `onWrite` and sync (`dataVersion`), and at midnight
  - debounced by 1 s
- Each run computes `planReminders(input, settings, now, now + 7 days)` without the `review:` keys. It sends the whole list to `schedule`, which replaces everything scheduled before.
- **Each reminder carries:**
  - a stable positive 31-bit id (FNV-1a of its key; ids 1–9 are reserved)
  - `at`, the title, the body and the route
  - a `check`: `{ kind: 'habit', id, date }`, `{ kind: 'task', id }`, `{ kind: 'project', id }`, or none for the focus end
  - The check comes from the reminder's kind, which `planReminders` returns next to its key (a small addition to `PlannedReminder`).
- **Server settings:** `server` holds the server address, the device token and `SCHEMA_VERSION` from the sync settings. It is null when the phone isn't connected.
- **Considered:** today only. Rejected, because the phone may not be opened every day.
- **Considered:** full background sync. Rejected as out of scope (see the proposal).

### 3. The check before showing

- **Request:** `ReminderReceiver` sends `POST <server>/api/reminder-check` with the token, the schema version header, and the body `{ kind, id, date? }`. Connect and read timeouts are 5 s. It shows the reminder unless the answer is `{ "needed": false }`. Any failure, a missing server or no check means show.
- **Server:** a new route in `server/src/api.ts` and `server/src/reminder-check.ts`, with plain queries on `habit_checks`, `habits`, `tasks` and `projects`:
  - an unknown id answers needed (not yet synced)
  - no schema change
- **Token on the phone:** it is stored in the app's private `SharedPreferences`, next to the database that already holds it. It isn't readable by other apps.

### 4. Ongoing focus notification

- **Updating it:** an effect on `useLiveQuery(getTimerView)` calls `showOngoing` with what the session runs for and "Running since HH:mm" or "Paused · N min" on every change, and `clearOngoing` without a session.
- **Not counting:** no live counting, so the app isn't woken.

### 5. Taps

- **Delivery:** the content intent carries the route.
  - `MainActivity` catches it in `onCreate` and `onNewIntent` (`LaunchRoute`). In the spike, the plugin's own `load` didn't see the launching intent.
  - `take_launch_route` returns it once. `src/platform/notify.ts` asks at start and on `visibilitychange` to visible, and feeds the route into `onNotificationClick`.
  - A route that arrives after its listener was unmounted (React mounts effects twice in development) is kept for the next listener.
- **Routing on the phone:**
  - `/tasks/<id>` opens Home plus `openTask(id)`
  - `/projects/<id>` opens Home
  - other routes open as they are
  - `useNotificationClicks` moves inside the providers so it can use `useOpenTask`.

### 6. Permission

- **When to ask:** at start when reminders are on and the permission is missing, and when the switch is turned on (`requestPermission`, through Tauri's plugin permission API on Android 13+).
- **State:** the result is kept in memory for `ReminderSettings`' "blocked" note.
- **Without the permission:** the runner schedules nothing.

## Risks / Trade-offs

- **Kotlin and Tauri plugin plumbing are new to the project:** the first task is a spike. It builds the plugin with one alarm that fires while the app is closed, its tap opening a route on a cold and a warm start, and the permission prompt. Any finding goes back into this design.
- **Inexact alarms:** without exact-alarm access, reminders can be a few minutes late.
- **Fails open:** offline or a slow server means a reminder that is already done may still show. That is the safe direction.
- **Data created on the desktop:** a new habit or deadline added on the desktop reaches the phone's schedule only after the phone opens.
- **Server deploy:** the new route needs a redeploy. Older APKs don't call it, so the order of deploy and install doesn't matter.

## Spike findings (emulator, Android 17 / API 37)

- **Permission:** `request_permission` shows Android's prompt, and the answer reaches the app.
- **Exact alarms:** `USE_EXACT_ALARM` gives exact alarms (`dumpsys alarm`: `exactAllowReason=policy_permission`). An alarm fires on time while the app's process has been killed. The broadcast starts the process without the WebView.
- **Taps:** a tap with the app in the background brings it forward on the route. A tap on a cold start opens the route once `MainActivity` catches the intent and the late route is kept.
- **Kill vs force-stop:** `am kill` (or the system ending the process) keeps the alarms. A force-stop from the Android settings removes them until the app is opened again, which is Android's rule.
