import 'package:flutter/material.dart';

import '../../../core/db/app_database.dart';
import '../../../core/numbers.dart';
import '../../../core/time/date_format.dart';

/// A KR with its progress and effective deadline.
class KeyResultTile extends StatelessWidget {
  const KeyResultTile({
    super.key,
    required this.keyResult,
    required this.progress,
    this.habitCheckIns = 0,
    required this.effectiveDeadline,
    this.onTap,
  });

  final KeyResult keyResult;

  /// 0–1.
  final double progress;

  /// Check-ins counted towards a habit KR.
  final int habitCheckIns;
  final CalendarDate effectiveDeadline;
  final VoidCallback? onTap;

  String _valueText() {
    final kr = keyResult;
    final percent = '${(progress * 100).round()}%';
    switch (kr.measureType) {
      case MeasureType.numeric:
        final unit = kr.unit == null ? '' : ' ${kr.unit}';
        final current = formatNumber(kr.currentValue ?? 0);
        final target = formatNumber(kr.targetValue ?? 0);
        return '$current / $target$unit · $percent';
      case MeasureType.boolean:
        return progress == 1 ? 'Done' : 'Not done';
      case MeasureType.habit:
        if (kr.habitId == null) return 'No habit linked';
        final target = formatNumber(kr.targetValue ?? 0);
        return '$habitCheckIns / $target check-ins · $percent';
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    keyResult.title,
                    style: theme.textTheme.titleSmall,
                  ),
                ),
                Text(
                  'Due ${formatDate(effectiveDeadline)}',
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
            const SizedBox(height: 6),
            LinearProgressIndicator(
              value: progress,
              minHeight: 6,
              borderRadius: BorderRadius.circular(3),
            ),
            const SizedBox(height: 4),
            Text(
              _valueText(),
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
