import 'dart:io';

import 'local_notification_scheduler.dart';
import 'notification_scheduler.dart';

/// Android gets real reminders; desktop and the test VM get none.
NotificationScheduler createPlatformScheduler() => Platform.isAndroid
    ? LocalNotificationScheduler()
    : const NoopNotificationScheduler();
