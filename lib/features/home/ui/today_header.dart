import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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
class TodayHeader extends ConsumerWidget {
  const TodayHeader({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final today = ref.watch(todayProvider);
    final progress = ref.watch(todayProgressProvider).value;
    final done = progress?.habitsDone ?? 0;
    final due = progress?.habitsDue ?? 0;
    final tasks = progress?.tasksDue ?? 0;
    return Padding(
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
                strokeWidth: 5,
                label: '$done/$due',
                color: theme.colorScheme.secondary,
              ),
              const SizedBox(height: 4),
              Text('Habits', style: theme.textTheme.bodySmall),
            ],
          ),
        ],
      ),
    );
  }
}
