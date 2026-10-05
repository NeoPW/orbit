import 'notification_scheduler.dart';

/// Web: no reminders.
NotificationScheduler createPlatformScheduler() =>
    const NoopNotificationScheduler();
