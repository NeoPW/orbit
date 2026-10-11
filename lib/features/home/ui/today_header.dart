import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/space/shooting_star.dart';
import '../../../core/time/date_format.dart';
import '../../../core/time/today.dart';
import '../../../core/widgets/orbit_ring.dart';
import '../data/home_providers.dart';

const _weekdays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/// Today's date and progress (home spec, "Today header").
/// A shooting star crosses it when the last habit of the day is checked.
class TodayHeader extends ConsumerStatefulWidget {
  const TodayHeader({super.key});

  @override
  ConsumerState<TodayHeader> createState() => _TodayHeaderState();
}

class _TodayHeaderState extends ConsumerState<TodayHeader> {
  var _shots = 0;

  @override
  Widget build(BuildContext context) {
    ref.listen(todayProgressProvider, (previous, next) {
      bool complete(TodayProgress? p) =>
          p != null && p.habitsDue > 0 && p.habitsDone >= p.habitsDue;
      final before = previous?.value;
      // Only on the change itself, not when Home opens with all done.
      if (before != null && !complete(before) && complete(next.value)) {
        setState(() => _shots++);
      }
    });
    final theme = Theme.of(context);
    final today = ref.watch(todayProvider);
    final progress = ref.watch(todayProgressProvider).value;
    final done = progress?.habitsDone ?? 0;
    final due = progress?.habitsDue ?? 0;
    final tasks = progress?.tasksDue ?? 0;
    return ShootingStar(
      shots: _shots,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _weekdays[today.weekday - 1],
                    style: theme.textTheme.headlineSmall,
                  ),
                  Text(formatDate(today), style: theme.textTheme.bodySmall),
                  const SizedBox(height: 8),
                  Text(
                    switch (tasks) {
                      0 => 'No tasks due',
                      1 => '1 task due',
                      _ => '$tasks tasks due',
                    },
                    style: theme.textTheme.labelLarge?.copyWith(
                      color: tasks > 0
                          ? theme.colorScheme.primary
                          : theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            Column(
              children: [
                OrbitRing(
                  progress: due == 0 ? 0 : done / due,
                  size: 64,
                  label: '$done/$due',
                  color: theme.colorScheme.secondary,
                ),
                const SizedBox(height: 4),
                Text('Habits', style: theme.textTheme.bodySmall),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
