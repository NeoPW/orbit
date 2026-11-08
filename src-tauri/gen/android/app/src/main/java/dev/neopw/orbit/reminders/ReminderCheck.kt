package dev.neopw.orbit.reminders

import android.util.Log
import java.net.HttpURLConnection
import java.net.URL
import org.json.JSONObject

/**
 * Asks the sync server whether a due reminder is still needed (`POST /api/reminder-check`). Fails open: without a
 * server, on any error or without an answer in about 5 seconds the reminder is shown.
 */
object ReminderCheck {
  private const val TAG = "OrbitReminders"
  private const val TIMEOUT_MS = 2500

  fun needed(server: ServerSettings?, check: JSONObject?): Boolean {
    if (server == null || check == null) return true
    return try {
      val connection = URL(server.url.trimEnd('/') + "/api/reminder-check").openConnection() as HttpURLConnection
      connection.connectTimeout = TIMEOUT_MS
      connection.readTimeout = TIMEOUT_MS
      connection.requestMethod = "POST"
      connection.doOutput = true
      connection.setRequestProperty("Content-Type", "application/json")
      connection.setRequestProperty("Authorization", "Bearer ${server.token}")
      connection.setRequestProperty("Orbit-Schema-Version", server.schemaVersion.toString())
      connection.outputStream.use { it.write(check.toString().toByteArray()) }
      if (connection.responseCode != 200) {
        Log.w(TAG, "Reminder check answered ${connection.responseCode}; showing the reminder")
        return true
      }
      val body = connection.inputStream.bufferedReader().use { it.readText() }
      JSONObject(body).optBoolean("needed", true)
    } catch (e: Exception) {
      Log.w(TAG, "Reminder check failed ($e); showing the reminder")
      true
    }
  }
}
