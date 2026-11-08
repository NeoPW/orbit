package dev.neopw.orbit

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import androidx.activity.SystemBarStyle
import androidx.activity.enableEdgeToEdge
import dev.neopw.orbit.reminders.LaunchRoute

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // All Orbit themes are dark: light status and navigation bar icons on the app's own ground.
    enableEdgeToEdge(
      statusBarStyle = SystemBarStyle.dark(Color.TRANSPARENT),
      navigationBarStyle = SystemBarStyle.dark(Color.TRANSPARENT),
    )
    // A tapped notification carries the route to open (see reminders/LaunchRoute).
    LaunchRoute.catchFrom(intent)
    super.onCreate(savedInstanceState)
  }

  override fun onNewIntent(intent: Intent) {
    LaunchRoute.catchFrom(intent)
    super.onNewIntent(intent)
  }
}
