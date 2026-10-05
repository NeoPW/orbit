import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/routes.dart';
import '../../../core/time/date_format.dart';
import '../../../core/time/today.dart';
import '../../../core/widgets/area_dot.dart';
import '../../tasks/ui/complete_task.dart';
import '../data/home_providers.dart';
import '../domain/deadline_badge.dart';

String deadlineBadgeText(DeadlineBadge badge) => switch (badge) {
  Overdue() => 'Overdue',
  DueToday() => 'Due today',
  DueTomorrow() => 'Due tomorrow',
  DueInDays(:final days) => 'Due in $days days',
  DueOn(:final date) => 'Due ${formatDate(date)}',
};

/// An active project on Home: title, area, deadline badge and next step.
/// Tapping the next step completes it (via the next-step prompt); tapping
/// elsewhere opens the project detail.
class HomeProjectCard extends ConsumerWidget {
  const HomeProjectCard({super.key, required this.item});

  final HomeProject item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final muted = theme.textTheme.bodySmall?.copyWith(
      color: theme.colorScheme.onSurfaceVariant,
    );
    final today = ref.watch(todayProvider);
    final deadline = item.scored.deadline;
    final badge = deadline == null ? null : deadlineBadge(deadline.date, today);
    final area = item.area;
    final nextStep = item.nextStep;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push(Routes.projectDetail(item.project.id)),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      item.project.title,
                      style: theme.textTheme.titleMedium,
                    ),
                  ),
                  if (badge != null) _Badge(badge: badge),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  if (area != null) ...[
                    AreaDot(color: area.color),
                    const SizedBox(width: 4),
                  ],
                  Text(area?.name ?? 'No area', style: muted),
                ],
              ),
              const SizedBox(height: 4),
              if (nextStep == null)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Text('No next step', style: muted),
                )
              else
                InkWell(
                  borderRadius: BorderRadius.circular(8),
                  onTap: () =>
                      completeTask(context, ref, nextStep, isNextStep: true),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Row(
                      children: [
                        Icon(
                          Icons.check_box_outline_blank,
                          size: 20,
                          color: theme.colorScheme.primary,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            nextStep.title,
                            semanticsLabel: 'Next step: ${nextStep.title}',
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.badge});

  final DeadlineBadge badge;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final urgent = badge is Overdue || badge is DueToday;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: urgent ? colors.errorContainer : colors.secondaryContainer,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        deadlineBadgeText(badge),
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
          color: urgent ? colors.onErrorContainer : colors.onSecondaryContainer,
        ),
      ),
    );
  }
}
