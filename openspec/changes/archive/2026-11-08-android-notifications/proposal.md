# Proposal

## Why

Reminders exist only on the desktop, and they come only while the desktop app runs (docs/SPEC.md §8). The phone is always at hand, but it reminds of nothing: no due habits, no deadlines and no end of a focus session. It also shows no sign of a session running. SPEC §9 names Android notifications as the next step of the Android companion.

A phone that plans reminders ahead would also remind of habits and tasks already done on the desktop, because it syncs only when it is opened. So each reminder asks the server first, at the moment it is due, whether it is still needed.

## What Changes

- **Reminders on Android:** habit reminders, deadline reminders and the end of a focus session (time limit) are scheduled with Android's alarm service, so they come while the app is closed.
  - The phone plans them for the next 7 days whenever it runs (at start, on returning to the foreground, after any change or sync, at midnight). Each time it replaces the ones it scheduled before.
  - They are scheduled again after the phone restarts.
  - The weekly review reminder is left out on the phone (the review is not on the phone).
- **Check before showing:** when a habit or deadline reminder is due, the phone asks the sync server whether it is still open:
  - the habit is not checked for that day
  - the task is still open
  - the project is still active
  
  It shows the reminder only then. Without a connection, without a configured server, or when the server doesn't answer within a few seconds, it shows the reminder anyway. The end of a focus session is shown without a check.
- **New server request:** `POST /api/reminder-check` answers whether a habit, task or project reminder is still needed, from the rows the server holds.
- **Ongoing focus notification:** while a session exists, a persistent notification shows "Thesis · Running since 10:15" or "Thesis · Paused · 25 min". It is updated on pause and resume, removed when the session ends, and opens focus mode when tapped.
- **Open from a notification:** tapping a reminder on the phone opens Home for a habit, the task popup over Home for a task, Home for a project, and focus mode for the end of a session or the ongoing notification.
- **Permission:** on Android 13+, the app asks for the notification permission when reminders are on (at first start or when the switch is turned on). When it is denied, Settings says so.
- **Settings on the phone:** the Reminders section shows the reminders switch, the default reminder time and the deadline lead time, replacing the note "Reminders are shown by the desktop app".
- **Per device:** desktop and phone each remind independently, each with its own Reminders switch.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `notifications`:
  - Adds "Reminders on Android", "Check before showing on Android", "Ongoing focus notification on Android" and "Notification permission on Android".
  - "Open from a notification" covers the phone.
  - "End of a focus session" also comes on Android.
- `settings`: adds "Reminder settings on Android".
- `sync-server`: adds "Reminder check".

## Impact

- **New Android code:** a small Tauri plugin of our own in Kotlin (`src-tauri/plugins/reminders/`):
  - alarm scheduling, the check before showing, notifications
  - the ongoing notification, permission and taps
  - rescheduling after reboot
  - It is registered only on Android. The desktop keeps `notify-rust`. No new npm or crate dependency beyond the plugin crate itself.
- **Server:**
  - `server/src/` gets the new request and its tests.
  - The server has to be redeployed. There's no schema change, so the schema version stays 5.
- **Code:**
  - `src/platform/notify.ts`
  - `src/features/notifications/`: an Android runner reusing `planReminders`
  - `src/features/settings/ui/ReminderSettings.tsx`
  - `src/app/useNotificationClicks.ts`
- **Android:** manifest permissions (`POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`, `RECEIVE_BOOT_COMPLETED`). A new APK is needed on the phone.
- **Docs:** `docs/SPEC.md` §7, §8 and §9.

## Out of scope

- **Full background sync:** a periodic native sync of all data.
  - A habit or deadline created on the desktop is scheduled on the phone only after the phone has opened once.
  - The phone's own data stays as of its last sync.
- Pause, Resume or Complete buttons in the notification, and a live-counting timer in it.
- A weekly review reminder on the phone.
- iOS, a Play Store release, and a home-screen widget.
