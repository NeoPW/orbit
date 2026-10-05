import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'planned_reminder.dart';
import 'scheduler_factory_stub.dart'
    if (dart.library.io) 'scheduler_factory_io.dart';

part 'notification_scheduler.g.dart';

/// Shows reminders as system notifications. Only Android has a real
/// implementation; elsewhere [NoopNotificationScheduler] is used.
abstract interface class NotificationScheduler {
  /// Whether this platform can show reminders at all.
  bool get supported;

  /// Sets up the plugin; [onTap] receives the route of a tapped reminder
  /// while the app runs.
  Future<void> init(void Function(String route) onTap);

  /// The route of the reminder whose tap started the app, if any.
  Future<String?> launchRoute();

  /// Asks the system for permission to show notifications, if needed.
  Future<void> requestPermission();

  /// Whether the system currently allows this app's notifications.
  Future<bool> notificationsAllowed();

  /// Replaces all scheduled reminders with [reminders].
  Future<void> replaceAll(List<PlannedReminder> reminders);
}

/// Used where reminders are not available (web, desktop, tests).
class NoopNotificationScheduler implements NotificationScheduler {
  const NoopNotificationScheduler();

  @override
  bool get supported => false;

  @override
  Future<void> init(void Function(String route) onTap) async {}

  @override
  Future<String?> launchRoute() async => null;

  @override
  Future<void> requestPermission() async {}

  @override
  Future<bool> notificationsAllowed() async => false;

  @override
  Future<void> replaceAll(List<PlannedReminder> reminders) async {}
}

/// The platform's scheduler. Tests override it with a fake.
@Riverpod(keepAlive: true)
NotificationScheduler notificationScheduler(Ref ref) =>
    createPlatformScheduler();

/// Whether the system allows notifications; re-read by invalidating it.
@riverpod
Future<bool> notificationsAllowed(Ref ref) =>
    ref.watch(notificationSchedulerProvider).notificationsAllowed();

/// The latest tapped reminder while the app runs. [seq] distinguishes two
/// taps on reminders with the same route.
typedef NotificationTapEvent = ({String route, int seq});

@Riverpod(keepAlive: true)
class NotificationTap extends _$NotificationTap {
  @override
  NotificationTapEvent? build() => null;

  void tapped(String route) =>
      state = (route: route, seq: (state?.seq ?? 0) + 1);
}
