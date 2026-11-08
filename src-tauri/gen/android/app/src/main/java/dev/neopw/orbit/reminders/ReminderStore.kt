package dev.neopw.orbit.reminders

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/** What the app scheduled, kept in private preferences so alarms and a restart can read it without the app. */
data class StoredReminder(
  val id: Int,
  val at: Long,
  val title: String,
  val body: String,
  val route: String,
  /** `{ kind, id, date? }` for the server check; null shows without asking (the end of a focus session). */
  val check: JSONObject?,
)

data class ServerSettings(val url: String, val token: String, val schemaVersion: Int)

object ReminderStore {
  private const val PREFS = "orbit_reminders"
  private const val LIST = "reminders"
  private const val SERVER = "server"

  private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun save(context: Context, reminders: List<StoredReminder>, server: ServerSettings?) {
    val list = JSONArray()
    for (r in reminders) {
      list.put(
        JSONObject()
          .put("id", r.id)
          .put("at", r.at)
          .put("title", r.title)
          .put("body", r.body)
          .put("route", r.route)
          .put("check", r.check ?: JSONObject.NULL),
      )
    }
    val serverJson = server?.let { JSONObject().put("url", it.url).put("token", it.token).put("schemaVersion", it.schemaVersion) }
    prefs(context).edit().putString(LIST, list.toString()).putString(SERVER, serverJson?.toString()).apply()
  }

  fun load(context: Context): List<StoredReminder> {
    val text = prefs(context).getString(LIST, null) ?: return emptyList()
    val list = JSONArray(text)
    return (0 until list.length()).map { i ->
      val o = list.getJSONObject(i)
      StoredReminder(
        id = o.getInt("id"),
        at = o.getLong("at"),
        title = o.getString("title"),
        body = o.getString("body"),
        route = o.getString("route"),
        check = o.optJSONObject("check"),
      )
    }
  }

  fun find(context: Context, id: Int): StoredReminder? = load(context).firstOrNull { it.id == id }

  fun server(context: Context): ServerSettings? {
    val text = prefs(context).getString(SERVER, null) ?: return null
    val o = JSONObject(text)
    return ServerSettings(o.getString("url"), o.getString("token"), o.getInt("schemaVersion"))
  }
}
