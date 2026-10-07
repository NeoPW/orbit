import 'package:flutter/material.dart';

import '../db/app_database.dart';
import '../theme/orbit_palette.dart';
import '../time/date_format.dart';
import '../time/deadline_badge.dart';
import 'area_dot.dart';

/// The text of a deadline badge, e.g. "Due in 3 days".
String deadlineBadgeText(DeadlineBadge badge) => switch (badge) {
  Overdue() => 'Overdue',
  DueToday() => 'Due today',
  DueTomorrow() => 'Due tomorrow',
  DueInDays(:final days) => 'Due in $days days',
  DueOn(:final date) => 'Due ${formatDate(date)}',
};

/// A small rounded label with an optional leading icon.
class _Pill extends StatelessWidget {
  const _Pill({
    required this.label,
    required this.background,
    required this.foreground,
    this.icon,
    this.leading,
  });

  final String label;
  final Color background;
  final Color foreground;
  final IconData? icon;
  final Widget? leading;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (leading != null) ...[leading!, const SizedBox(width: 5)],
          if (icon != null) ...[
            Icon(icon, size: 13, color: foreground),
            const SizedBox(width: 4),
          ],
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.labelMedium
                  ?.copyWith(color: foreground),
            ),
          ),
        ],
      ),
    );
  }
}

/// A deadline as a badge: red when overdue, amber when due within
/// [leadDays], neutral otherwise (visual-design spec).
class DeadlineChip extends StatelessWidget {
  const DeadlineChip({
    super.key,
    required this.date,
    required this.today,
    this.leadDays = 7,
    this.inherited = false,
  });

  final CalendarDate date;
  final CalendarDate today;
  final int leadDays;

  /// Marks a deadline taken over from the key result.
  final bool inherited;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final orbit = OrbitColors.of(context);
    final badge = deadlineBadge(date, today);
    final days = today.daysUntil(date);
    final (background, foreground) = switch (badge) {
      Overdue() => (orbit.overdue, orbit.onOverdue),
      _ when days <= leadDays => (orbit.urgent, orbit.onUrgent),
      _ => (colors.surfaceContainerHighest, colors.onSurfaceVariant),
    };
    final text = deadlineBadgeText(badge);
    return Tooltip(
      message: inherited ? '$text (from key result)' : text,
      child: _Pill(
        label: inherited ? '$text · KR' : text,
        background: background,
        foreground: foreground,
        icon: Icons.event_outlined,
      ),
    );
  }
}

/// An area as a chip with its color.
class AreaChip extends StatelessWidget {
  const AreaChip({super.key, required this.area});

  final Area area;

  @override
  Widget build(BuildContext context) {
    final color = colorFromHex(area.color);
    return _Pill(
      label: area.name,
      background: color.withValues(alpha: 0.16),
      foreground: Theme.of(context).colorScheme.onSurface,
      leading: AreaDot(color: area.color, size: 8),
    );
  }
}

/// A status as a colored chip; with [options] tapping it offers the other
/// statuses.
class StatusChip<T> extends StatelessWidget {
  const StatusChip({
    super.key,
    required this.label,
    required this.color,
    this.options = const [],
    this.onSelected,
  });

  final String label;
  final Color color;

  /// The statuses offered when tapped (the current one left out).
  final List<(T, String)> options;
  final ValueChanged<T>? onSelected;

  @override
  Widget build(BuildContext context) {
    final pill = _Pill(
      label: label,
      background: color.withValues(alpha: 0.18),
      foreground: color,
      icon: options.isEmpty ? Icons.circle : Icons.expand_more,
    );
    if (options.isEmpty || onSelected == null) return pill;
    return PopupMenuButton<T>(
      tooltip: 'Change status',
      onSelected: onSelected,
      itemBuilder: (context) => [
        for (final (value, text) in options)
          PopupMenuItem(value: value, child: Text(text)),
      ],
      child: pill,
    );
  }
}

/// Importance as filled dots out of five.
class ImportanceDots extends StatelessWidget {
  const ImportanceDots({super.key, required this.value, this.max = 5});

  final int value;
  final int max;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Semantics(
      label: 'Importance $value of $max',
      child: ExcludeSemantics(
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (var i = 1; i <= max; i++)
              Container(
                width: 7,
                height: 7,
                margin: const EdgeInsets.only(right: 3),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: i <= value ? colors.primary : colors.outlineVariant,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
