package dev.neopw.orbit.reminders

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build

/** Sets one alarm per stored reminder, exact when the system allows it, and cancels the ones set before. */
object AlarmScheduler {
  const val ACTION = "dev.neopw.orbit.REMINDER"
  const val EXTRA_ID = "reminder_id"

  private fun pending(context: Context, id: Int, flags: Int): PendingIntent? {
    val intent = Intent(context, ReminderReceiver::class.java).setAction(ACTION).putExtra(EXTRA_ID, id)
    return PendingIntent.getBroadcast(context, id, intent, flags or PendingIntent.FLAG_IMMUTABLE)
  }

  /** Replaces all alarms: cancels `previous`, then sets one for each reminder still in the future. */
  fun replace(context: Context, previous: List<StoredReminder>, next: List<StoredReminder>) {
    val alarms = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    for (r in previous) pending(context, r.id, PendingIntent.FLAG_NO_CREATE)?.let { alarms.cancel(it); it.cancel() }
    setAll(context, next)
  }

  /** Sets the alarms of the future reminders (also after a restart, when no alarm is left). */
  fun setAll(context: Context, reminders: List<StoredReminder>) {
    val alarms = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val now = System.currentTimeMillis()
    val exact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarms.canScheduleExactAlarms()
    for (r in reminders) {
      if (r.at <= now) continue
      val intent = pending(context, r.id, PendingIntent.FLAG_UPDATE_CURRENT) ?: continue
      if (exact) alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, r.at, intent)
      else alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, r.at, intent)
    }
  }
}
