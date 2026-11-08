package dev.neopw.orbit.reminders

import android.Manifest
import android.app.Activity
import app.tauri.PermissionState
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.Permission
import app.tauri.annotation.PermissionCallback
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import org.json.JSONObject

@InvokeArg
class CheckArg {
  var kind: String = ""
  var id: String = ""
  var date: String? = null
}

@InvokeArg
class ReminderArg {
  var id: Int = 0
  /** Epoch milliseconds. */
  var at: Long = 0
  var title: String = ""
  var body: String = ""
  var route: String = "/home"
  var check: CheckArg? = null
}

@InvokeArg
class ServerArg {
  var url: String = ""
  var token: String = ""
  var schemaVersion: Int = 0
}

@InvokeArg
class ScheduleArgs {
  var reminders: List<ReminderArg> = emptyList()
  var server: ServerArg? = null
}

@InvokeArg
class OngoingArgs {
  var title: String = ""
  var body: String = ""
}

/** Reminders, the ongoing focus notification and notification taps for the web app (see src-tauri/src/reminders.rs). */
@TauriPlugin(permissions = [Permission(strings = [Manifest.permission.POST_NOTIFICATIONS], alias = "notifications")])
class RemindersPlugin(private val activity: Activity) : Plugin(activity) {
  @Command
  fun schedule(invoke: Invoke) {
    val args = invoke.parseArgs(ScheduleArgs::class.java)
    val next = args.reminders.map { r ->
      val check = r.check?.let { c -> JSONObject().put("kind", c.kind).put("id", c.id).apply { c.date?.let { put("date", it) } } }
      StoredReminder(r.id, r.at, r.title, r.body, r.route, check)
    }
    val server = args.server?.let { ServerSettings(it.url, it.token, it.schemaVersion) }
    val previous = ReminderStore.load(activity)
    ReminderStore.save(activity, next, server)
    AlarmScheduler.replace(activity, previous, next)
    invoke.resolve()
  }

  @Command
  fun showOngoing(invoke: Invoke) {
    val args = invoke.parseArgs(OngoingArgs::class.java)
    Notifier.showOngoing(activity, args.title, args.body)
    invoke.resolve()
  }

  @Command
  fun clearOngoing(invoke: Invoke) {
    Notifier.clearOngoing(activity)
    invoke.resolve()
  }

  @Command
  fun takeLaunchRoute(invoke: Invoke) {
    val result = JSObject()
    result.put("route", LaunchRoute.take())
    invoke.resolve(result)
  }

  private fun stateResult(invoke: Invoke) {
    val result = JSObject()
    result.put("granted", Notifier.allowed(activity))
    invoke.resolve(result)
  }

  @Command
  fun permissionState(invoke: Invoke) {
    stateResult(invoke)
  }

  @Command
  fun requestPermission(invoke: Invoke) {
    if (Notifier.allowed(activity) || getPermissionState("notifications") == PermissionState.GRANTED) stateResult(invoke)
    else requestPermissionForAlias("notifications", invoke, "permissionAnswered")
  }

  @PermissionCallback
  fun permissionAnswered(invoke: Invoke) {
    stateResult(invoke)
  }
}
