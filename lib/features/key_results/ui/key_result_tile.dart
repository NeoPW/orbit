import 'package:flutter/material.dart';

import '../../../core/db/app_database.dart';
import '../../../core/numbers.dart';
import '../../../core/widgets/orbit_chips.dart';
import '../../../core/widgets/orbit_ring.dart';

/// A KR with its progress as an orbit ring and, until it is reached, its
/// effective deadline.
class KeyResultTile extends StatelessWidget {
  const KeyResultTile({
    super.key,
    required this.keyResult,
    required this.progress,
    this.habitCheckIns = 0,
    required this.effectiveDeadline,
    required this.today,
    this.leadDays = 7,
    this.onTap,
  });

  final KeyResult keyResult;

  /// 0–1.
  final double progress;

  /// Check-ins counted towards a habit KR.
  final int habitCheckIns;
  final CalendarDate effectiveDeadline;
  final CalendarDate today;
  final int leadDays;
  final VoidCallback? onTap;

  String _valueText() {
    final kr = keyResult;
    switch (kr.measureType) {
      case MeasureType.numeric:
        final unit = kr.unit == null ? '' : ' ${kr.unit}';
        final current = formatNumber(kr.currentValue ?? 0);
        final target = formatNumber(kr.targetValue ?? 0);
        return '$current / $target$unit';
      case MeasureType.boolean:
        return progress == 1 ? 'Done' : 'Not done';
      case MeasureType.habit:
        if (kr.habitId == null) return 'No habit linked';
        final target = formatNumber(kr.targetValue ?? 0);
        return '$habitCheckIns / $target check-ins';
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final done = progress >= 1;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(
          children: [
            OrbitRing(
              progress: progress,
              size: 44,
              label: '${(progress * 100).round()}%',
              color: done ? theme.colorScheme.secondary : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(keyResult.title, style: theme.textTheme.titleSmall),
                  const SizedBox(height: 2),
                  Text(
                    _valueText(),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            // A reached KR has no deadline pressure left.
            if (!done) ...[
              const SizedBox(width: 8),
              DeadlineChip(
                date: effectiveDeadline,
                today: today,
                leadDays: leadDays,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
