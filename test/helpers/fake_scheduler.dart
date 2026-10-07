import 'package:orbit/core/notifications/notification_scheduler.dart';
import 'package:orbit/core/notifications/planned_reminder.dart';

/// Records what the app asks the scheduler to do.
class FakeNotificationScheduler implements NotificationScheduler {
  FakeNotificationScheduler({this.supported = true, this.allowed = true});

  @override
  final bool supported;
  bool allowed;

  /// Every list passed to [replaceAll], oldest first.
  final calls = <List<PlannedReminder>>[];
  int permissionRequests = 0;
  void Function(String route)? onTap;
  String? launch;

  List<PlannedReminder>? get scheduled => calls.isEmpty ? null : calls.last;

  @override
  Future<void> init(void Function(String route) onTap) async =>
      this.onTap = onTap;

  @override
  Future<String?> launchRoute() async => launch;

  @override
  Future<void> requestPermission() async => permissionRequests++;

  @override
  Future<bool> notificationsAllowed() async => allowed;

  @override
  Future<void> replaceAll(List<PlannedReminder> reminders) async =>
      calls.add(List.unmodifiable(reminders));

  /// The shown timer notification, if any.
  ({String title, DateTime startedAt})? timer;
  int timerShows = 0;

  @override
  Future<void> showTimer({
    required String title,
    required DateTime startedAt,
  }) async {
    timer = (title: title, startedAt: startedAt);
    timerShows++;
  }

  @override
  Future<void> cancelTimer() async => timer = null;
}
