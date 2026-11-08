package dev.neopw.orbit.reminders

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import kotlin.concurrent.thread

/** A reminder's alarm: checks with the server (off the main thread) and shows it when still needed. */
class ReminderReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val id = intent.getIntExtra(AlarmScheduler.EXTRA_ID, -1)
    val reminder = ReminderStore.find(context, id) ?: return
    val done = goAsync()
    thread {
      try {
        if (ReminderCheck.needed(ReminderStore.server(context), reminder.check)) Notifier.showReminder(context, reminder)
      } finally {
        done.finish()
      }
    }
  }
}

/** After a restart no alarm is left: set the stored future ones again. */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Intent.ACTION_BOOT_COMPLETED) return
    AlarmScheduler.setAll(context, ReminderStore.load(context))
  }
}
