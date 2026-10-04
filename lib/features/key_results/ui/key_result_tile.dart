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
    required this.effectiveDeadline,
    this.onTap,
  });

  final KeyResult keyResult;

  /// 0–1, or null for habit KRs.
  final double? progress;
  final CalendarDate effectiveDeadline;
  final VoidCallback? onTap;

  String _valueText() {
    final kr = keyResult;
    switch (kr.measureType) {
      case MeasureType.numeric:
        final unit = kr.unit == null ? '' : ' ${kr.unit}';
        final current = formatNumber(kr.currentValue ?? 0);
        final target = formatNumber(kr.targetValue ?? 0);
        return '$current / $target$unit · ${((progress ?? 0) * 100).round()}%';
      case MeasureType.boolean:
        return progress == 1 ? 'Done' : 'Not done';
      case MeasureType.habit:
        return 'Progress available from milestone 2';
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final progress = this.progress;
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
            if (progress != null) ...[
              LinearProgressIndicator(
                value: progress,
                minHeight: 6,
                borderRadius: BorderRadius.circular(3),
              ),
              const SizedBox(height: 4),
            ],
            Text(
              _valueText(),
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
                fontStyle: progress == null ? FontStyle.italic : null,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
