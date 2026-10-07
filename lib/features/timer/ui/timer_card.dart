import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/db/app_database.dart';
import '../../../core/messages/messenger.dart';
import '../../../core/time/clock.dart';
import '../../log/domain/duration.dart';
import '../../projects/data/project_repository.dart';
import '../../tasks/data/task_repository.dart';
import '../data/timer_repository.dart';
import '../domain/timer_time.dart';

/// What the running [timer] is for, as a title ("Deleted item" when its
/// project or task is gone).
String? timerTitle(WidgetRef ref, WorkTimer timer) {
  final projectId = timer.projectId;
  final taskId = timer.taskId;
  final AsyncValue<Object?> target = projectId != null
      ? ref.watch(projectProvider(projectId))
      : ref.watch(taskProvider(taskId!));
  return switch (target.value) {
    Project(:final title) || Task(:final title) => title,
    _ when target.isLoading => null,
    _ => 'Deleted item',
  };
}

/// The running timer on Home (work-timer spec, "Timer card on Home"): what
/// it runs for, the live elapsed time, Stop and Discard. Nothing without a
/// running timer.
class TimerCard extends ConsumerWidget {
  const TimerCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final timer = ref.watch(runningTimerProvider).value;
    final animate = !MediaQuery.disableAnimationsOf(context);
    return AnimatedSize(
      duration: animate ? const Duration(milliseconds: 250) : Duration.zero,
      alignment: Alignment.topCenter,
      child: timer == null
          ? const SizedBox(width: double.infinity)
          : _RunningTimer(key: ValueKey(timer.startedAt), timer: timer),
    );
  }
}

class _RunningTimer extends ConsumerStatefulWidget {
  const _RunningTimer({super.key, required this.timer});

  final WorkTimer timer;

  @override
  ConsumerState<_RunningTimer> createState() => _RunningTimerState();
}

class _RunningTimerState extends ConsumerState<_RunningTimer> {
  late final Timer _ticker;

  @override
  void initState() {
    super.initState();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _ticker.cancel();
    super.dispose();
  }

  Future<void> _stop(String title) async {
    final messenger = ref.read(messengerProvider.notifier);
    final entry = await ref.read(timerRepositoryProvider).stop();
    if (entry == null) return;
    messenger.show(
      Message(
        'Logged ${formatDuration(entry.durationMinutes!)} on $title',
        icon: Icons.more_time,
      ),
    );
  }

  Future<void> _discard() async {
    final messenger = ref.read(messengerProvider.notifier);
    await ref.read(timerRepositoryProvider).discard();
    messenger.show(Message('Timer discarded', icon: Icons.timer_off_outlined));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final title = timerTitle(ref, widget.timer) ?? '';
    final elapsed = timerElapsed(
      widget.timer.startedAt,
      ref.watch(clockProvider)(),
    );
    return Card(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      color: colors.primaryContainer,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 12, 12),
        child: Row(
          children: [
            Icon(Icons.timer_outlined, color: colors.onPrimaryContainer),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.titleSmall?.copyWith(
                      color: colors.onPrimaryContainer,
                    ),
                  ),
                  Text(
                    formatElapsed(elapsed),
                    style: theme.textTheme.headlineSmall?.copyWith(
                      color: colors.onPrimaryContainer,
                      fontFeatures: const [FontFeature.tabularFigures()],
                    ),
                  ),
                ],
              ),
            ),
            TextButton(onPressed: _discard, child: const Text('Discard')),
            const SizedBox(width: 4),
            FilledButton.icon(
              onPressed: () => _stop(title),
              icon: const Icon(Icons.stop),
              label: const Text('Stop'),
            ),
          ],
        ),
      ),
    );
  }
}
