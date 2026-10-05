import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:timezone/data/latest_all.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;

import 'notification_scheduler.dart';
import 'planned_reminder.dart';

/// Reminders on Android through flutter_local_notifications.
class LocalNotificationScheduler implements NotificationScheduler {
  LocalNotificationScheduler();

  final _plugin = FlutterLocalNotificationsPlugin();

  AndroidFlutterLocalNotificationsPlugin? get _android => _plugin
      .resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin
      >();

  static const _channels = {
    ReminderKind.habit: AndroidNotificationDetails(
      'habit_reminders',
      'Habit reminders',
      channelDescription: 'Habits that are due and not yet checked',
      importance: Importance.high,
      priority: Priority.high,
    ),
    ReminderKind.review: AndroidNotificationDetails(
      'review_reminders',
      'Weekly review',
      channelDescription: 'The reminder to review the week',
      importance: Importance.high,
      priority: Priority.high,
    ),
    ReminderKind.deadline: AndroidNotificationDetails(
      'deadline_reminders',
      'Deadline reminders',
      channelDescription: 'Tasks, projects and key results coming due',
      importance: Importance.high,
      priority: Priority.high,
    ),
  };

  @override
  bool get supported => true;

  @override
  Future<void> init(void Function(String route) onTap) async {
    tz_data.initializeTimeZones();
    try {
      final zone = await FlutterTimezone.getLocalTimezone();
      tz.setLocalLocation(tz.getLocation(zone.identifier));
    } on Object {
      // Unknown zone name: keep UTC rather than not scheduling at all.
    }
    await _plugin.initialize(
      settings: const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      ),
      onDidReceiveNotificationResponse: (response) {
        final route = response.payload;
        if (route != null) onTap(route);
      },
    );
  }

  @override
  Future<String?> launchRoute() async {
    final details = await _plugin.getNotificationAppLaunchDetails();
    if (details == null || !details.didNotificationLaunchApp) return null;
    return details.notificationResponse?.payload;
  }

  @override
  Future<void> requestPermission() async {
    await _android?.requestNotificationsPermission();
  }

  @override
  Future<bool> notificationsAllowed() async =>
      await _android?.areNotificationsEnabled() ?? false;

  @override
  Future<void> replaceAll(List<PlannedReminder> reminders) async {
    // Exact, so reminders arrive on the minute; inexact ones got a one-hour
    // delivery window. Falls back if exact alarms are not permitted.
    final exact = await _android?.canScheduleExactNotifications() ?? false;
    final mode = exact
        ? AndroidScheduleMode.exactAllowWhileIdle
        : AndroidScheduleMode.inexactAllowWhileIdle;
    await _plugin.cancelAll();
    for (final (id, reminder) in reminders.indexed) {
      final at = reminder.at;
      await _plugin.zonedSchedule(
        id: id,
        scheduledDate: tz.TZDateTime(
          tz.local,
          at.year,
          at.month,
          at.day,
          at.hour,
          at.minute,
        ),
        notificationDetails: NotificationDetails(
          android: _channels[reminder.kind],
        ),
        androidScheduleMode: mode,
        title: reminder.title,
        body: reminder.body,
        payload: reminder.route,
      );
    }
  }
}
