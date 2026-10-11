import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/routes.dart';
import '../../plan/data/plan_providers.dart';
import '../../plan/ui/objective_system.dart';

/// The active objectives as a row of star systems, each with its KRs as
/// planets and labeled with its title and progress. Tapping one opens the
/// objective.
class HomeStarSystems extends ConsumerWidget {
  const HomeStarSystems({super.key});

  static const _itemWidth = 112.0;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final objectives = ref.watch(planOverviewProvider).value?.objectives;
    if (objectives == null || objectives.isEmpty) {
      return const SizedBox.shrink();
    }
    final theme = Theme.of(context);
    return SizedBox(
      height: 136,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        itemCount: objectives.length,
        separatorBuilder: (_, _) => const SizedBox(width: 4),
        itemBuilder: (context, i) {
          final system = ObjectiveSystem(objectives[i]);
          final objective = system.plan.objective;
          final percent = (system.progress * 100).round();
          return SizedBox(
            width: _itemWidth,
            child: Semantics(
              button: true,
              label: '${objective.title}, $percent percent',
              child: InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: () => context.push(Routes.objective(objective.id)),
                child: ExcludeSemantics(
                  child: Column(
                    children: [
                      // The orbits are flat: the square icon has empty room
                      // above and below that the label may use.
                      SizedBox(
                        height: 72,
                        child: OverflowBox(
                          maxHeight: 96,
                          child: system.compact(size: 96),
                        ),
                      ),
                      Text(
                        objective.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                        style: theme.textTheme.labelLarge?.copyWith(
                          height: 1.2,
                        ),
                      ),
                      Text(
                        '$percent %',
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: system.color,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
