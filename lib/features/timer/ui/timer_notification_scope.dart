import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/notifications/notification_scheduler.dart';
import '../data/timer_repository.dart';
import 'timer_card.dart';

/// Shows the ongoing timer notification while a timer runs, also one
/// started on another device, and removes it when the timer ends
/// (notifications spec, "Running timer notification"). Independent of the
/// reminders setting; asks for the notification permission once when a
/// timer runs without it.
class TimerNotificationScope extends ConsumerStatefulWidget {
  const TimerNotificationScope({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<TimerNotificationScope> createState() =>
      _TimerNotificationScopeState();
}

class _TimerNotificationScopeState
    extends ConsumerState<TimerNotificationScope> {
  /// What the notification currently shows; null when none is shown.
  ({String title, DateTime startedAt})? _shown;
  bool _askedPermission = false;

  Future<void> _apply(
    NotificationScheduler scheduler,
    ({String title, DateTime startedAt})? wanted,
  ) async {
    if (wanted == _shown) return;
    _shown = wanted;
    if (wanted == null) {
      await scheduler.cancelTimer();
      return;
    }
    if (!_askedPermission && !await scheduler.notificationsAllowed()) {
      _askedPermission = true;
      await scheduler.requestPermission();
    }
    await scheduler.showTimer(title: wanted.title, startedAt: wanted.startedAt);
  }

  @override
  Widget build(BuildContext context) {
    final scheduler = ref.watch(notificationSchedulerProvider);
    if (scheduler.supported) {
      final running = ref.watch(runningTimerProvider);
      if (!running.isLoading) {
        final timer = running.value;
        final title = timer == null ? null : timerTitle(ref, timer);
        // Wait for the title instead of showing an empty one.
        if (timer == null || title != null) {
          final wanted = timer == null
              ? null
              : (title: title!, startedAt: timer.startedAt);
          WidgetsBinding.instance.addPostFrameCallback(
            (_) => _apply(scheduler, wanted),
          );
        }
      }
    }
    return widget.child;
  }
}
