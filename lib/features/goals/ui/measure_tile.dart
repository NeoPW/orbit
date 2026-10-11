import 'package:flutter/material.dart';

import '../../../core/db/app_database.dart';
import '../../../core/numbers.dart';
import '../../../core/theme/orbit_palette.dart';

/// A measure's value: "40 / 100 km", "Done" / "Not done", or check-ins.
String measureValueText(
  Measure measure, {
  required double progress,
  int habitCheckIns = 0,
}) {
  switch (measure.measureType) {
    case MeasureType.numeric:
      final unit = measure.unit == null ? '' : ' ${measure.unit}';
      final current = formatNumber(measure.currentValue ?? 0);
      final target = formatNumber(measure.targetValue ?? 0);
      return '$current / $target$unit';
    case MeasureType.boolean:
      return progress == 1 ? 'Done' : 'Not done';
    case MeasureType.habit:
      if (measure.habitId == null) return 'No habit linked';
      final target = formatNumber(measure.targetValue ?? 0);
      return '$habitCheckIns / $target check-ins';
  }
}

/// Progress as a slim bar in a goal's [color], with the percentage after it
/// (visual-design spec, "Progress as orbit rings").
class MeasureBar extends StatelessWidget {
  const MeasureBar({super.key, required this.progress, required this.color});

  /// 0–1.
  final double progress;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final value = progress.clamp(0.0, 1.0);
    final percent = '${(value * 100).round()}%';
    return Semantics(
      label: '$percent done',
      child: ExcludeSemantics(
        child: Row(
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(3),
                child: SizedBox(
                  height: 5,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      ColoredBox(color: OrbitColors.of(context).ringTrack),
                      FractionallySizedBox(
                        alignment: Alignment.centerLeft,
                        widthFactor: value,
                        child: DecoratedBox(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(3),
                            gradient: LinearGradient(
                              colors: [
                                color.withValues(alpha: 0.7),
                                Color.lerp(color, Colors.white, 0.25)!,
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            SizedBox(
              width: 40,
              child: Text(
                percent,
                textAlign: TextAlign.end,
                style: theme.textTheme.labelMedium?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// A measure with its progress as a bar in its goal's [color].
class MeasureTile extends StatelessWidget {
  const MeasureTile({
    super.key,
    required this.measure,
    required this.progress,
    required this.color,
    this.habitCheckIns = 0,
    this.onTap,
  });

  final Measure measure;

  /// 0–1.
  final double progress;

  /// Check-ins counted towards a habit measure.
  final int habitCheckIns;

  /// The goal's color.
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(measure.title, style: theme.textTheme.titleSmall),
                ),
                const SizedBox(width: 8),
                Text(
                  measureValueText(
                    measure,
                    progress: progress,
                    habitCheckIns: habitCheckIns,
                  ),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            MeasureBar(progress: progress, color: color),
          ],
        ),
      ),
    );
  }
}
