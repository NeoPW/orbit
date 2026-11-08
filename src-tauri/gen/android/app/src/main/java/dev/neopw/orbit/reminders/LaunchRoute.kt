package dev.neopw.orbit.reminders

import android.content.Intent

/**
 * The route of the notification that opened or resumed the app, caught by MainActivity (onCreate, onNewIntent) and
 * taken once by the web app through the plugin's `takeLaunchRoute`.
 */
object LaunchRoute {
  @Volatile private var route: String? = null

  fun catchFrom(intent: Intent?) {
    val next = intent?.getStringExtra(Notifier.EXTRA_ROUTE) ?: return
    route = next
    intent.removeExtra(Notifier.EXTRA_ROUTE)
  }

  fun take(): String? {
    val current = route
    route = null
    return current
  }
}
