import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/routes.dart';
import '../../../core/time/today.dart';
import '../../../core/widgets/area_dot.dart';
import '../../../core/widgets/orbit_chips.dart';
import '../../settings/data/settings_repository.dart';
import '../../tasks/ui/complete_task.dart';
import '../data/home_providers.dart';

/// An active project on Home: an area accent, title, deadline badge, area
/// and importance, and the next step as a checkbox row. Ticking the next
/// step completes it (via the next-step prompt); tapping elsewhere opens
/// the project detail.
class HomeProjectCard extends ConsumerWidget {
  const HomeProjectCard({super.key, required this.item});

  final HomeProject item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final today = ref.watch(todayProvider);
    final leadDays = ref.watch(appSettingsProvider).value?.deadlineLeadDays;
    final deadline = item.scored.deadline;
    final area = item.area;
    final nextStep = item.nextStep;

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push(Routes.projectDetail(item.project.id)),
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                width: 4,
                color: area == null
                    ? colors.outlineVariant
                    : colorFromHex(area.color),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(14, 12, 14, 6),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Text(
                              item.project.title,
                              style: theme.textTheme.titleMedium,
                            ),
                          ),
                          if (deadline != null)
                            DeadlineChip(
                              date: deadline.date,
                              today: today,
                              leadDays: leadDays ?? 7,
                              inherited: deadline.inherited,
                            ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 10,
                        runSpacing: 6,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          if (area != null) AreaChip(area: area),
                          ImportanceDots(value: item.project.importance),
                        ],
                      ),
                      const SizedBox(height: 4),
                      if (nextStep == null)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: Text(
                            'No next step',
                            style: theme.textTheme.bodySmall,
                          ),
                        )
                      else
                        InkWell(
                          borderRadius: BorderRadius.circular(8),
                          onTap: () => completeTask(
                            context,
                            ref,
                            nextStep,
                            isNextStep: true,
                          ),
                          child: Row(
                            children: [
                              Checkbox(
                                value: false,
                                semanticLabel: 'Complete ${nextStep.title}',
                                onChanged: (_) => completeTask(
                                  context,
                                  ref,
                                  nextStep,
                                  isNextStep: true,
                                ),
                              ),
                              Icon(Icons.flag, size: 14, color: colors.primary),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  nextStep.title,
                                  semanticsLabel:
                                      'Next step: ${nextStep.title}',
                                ),
                              ),
                            ],
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
