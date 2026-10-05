import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/notifications/notification_scheduler.dart';
import '../../settings/data/settings_repository.dart';
import '../data/reminder_sync.dart';

/// Keeps reminders scheduled while the app runs, on platforms that support
/// them, and asks for the notification permission once when reminders are
/// on (notifications spec).
class ReminderSyncScope extends ConsumerStatefulWidget {
  const ReminderSyncScope({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<ReminderSyncScope> createState() => _ReminderSyncScopeState();
}

class _ReminderSyncScopeState extends ConsumerState<ReminderSyncScope> {
  bool _askedPermission = false;

  @override
  Widget build(BuildContext context) {
    final scheduler = ref.watch(notificationSchedulerProvider);
    if (scheduler.supported) {
      ref.watch(reminderSyncProvider);
      final enabled = ref.watch(appSettingsProvider).value?.remindersEnabled;
      if (enabled == true && !_askedPermission) {
        _askedPermission = true;
        scheduler.requestPermission();
      }
    }
    return widget.child;
  }
}
