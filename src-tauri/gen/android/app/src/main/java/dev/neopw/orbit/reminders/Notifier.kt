package dev.neopw.orbit.reminders

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import dev.neopw.orbit.MainActivity
import dev.neopw.orbit.R

/** The two channels and the notifications Orbit shows on the phone. */
object Notifier {
  const val EXTRA_ROUTE = "orbit_route"
  private const val REMINDERS = "reminders"
  private const val FOCUS = "focus"
  const val ONGOING_ID = 1

  private fun channels(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = context.getSystemService(NotificationManager::class.java)
    manager.createNotificationChannel(NotificationChannel(REMINDERS, "Reminders", NotificationManager.IMPORTANCE_HIGH))
    manager.createNotificationChannel(NotificationChannel(FOCUS, "Focus session", NotificationManager.IMPORTANCE_LOW))
  }

  fun allowed(context: Context): Boolean =
    Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
      ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED

  /** Opens the app (or brings it to the front) with the route; the plugin hands it to the web app. */
  private fun open(context: Context, requestCode: Int, route: String): PendingIntent {
    val intent = Intent(context, MainActivity::class.java)
      .putExtra(EXTRA_ROUTE, route)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    return PendingIntent.getActivity(context, requestCode, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  fun showReminder(context: Context, reminder: StoredReminder) {
    if (!allowed(context)) return
    channels(context)
    val notification = NotificationCompat.Builder(context, REMINDERS)
      .setSmallIcon(R.drawable.ic_notification)
      .setContentTitle(reminder.title)
      .setContentText(reminder.body)
      .setAutoCancel(true)
      .setContentIntent(open(context, reminder.id, reminder.route))
      .build()
    NotificationManagerCompat.from(context).notify(reminder.id, notification)
  }

  fun showOngoing(context: Context, title: String, body: String) {
    if (!allowed(context)) return
    channels(context)
    val notification = NotificationCompat.Builder(context, FOCUS)
      .setSmallIcon(R.drawable.ic_notification)
      .setContentTitle(title)
      .setContentText(body)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setSilent(true)
      .setContentIntent(open(context, ONGOING_ID, "/focus"))
      .build()
    NotificationManagerCompat.from(context).notify(ONGOING_ID, notification)
  }

  fun clearOngoing(context: Context) {
    NotificationManagerCompat.from(context).cancel(ONGOING_ID)
  }
}
