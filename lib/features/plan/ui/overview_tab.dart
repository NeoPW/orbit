import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/routes.dart';
import '../../../core/time/date_format.dart';
import '../../../core/widgets/async_body.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/max_width_body.dart';
import '../../account/ui/sync_refresh.dart';
import '../../key_results/ui/key_result_tile.dart';
import '../../projects/ui/project_tile.dart';
import '../data/plan_providers.dart';
import '../domain/plan_overview.dart';

/// Active objectives → KRs → active projects, then active projects without
/// a KR.
class OverviewTab extends ConsumerWidget {
  const OverviewTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AsyncBody(
      value: ref.watch(planOverviewProvider),
      data: (overview) => MaxWidthBody(
        child: SyncRefresh(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 88),
            children: [
              if (overview.objectives.isEmpty)
                EmptyState(
                  icon: Icons.flag_outlined,
                  message: 'No active objectives.',
                  action: FilledButton.tonal(
                    onPressed: () => context.push(Routes.newObjective),
                    child: const Text('Create objective'),
                  ),
                )
              else
                for (final objective in overview.objectives)
                  _ObjectiveCard(plan: objective),
              const _SectionHeader('Projects without a KR'),
              if (overview.projectsWithoutKr.isEmpty)
                const _Hint('No active projects without a key result.')
              else
                Card.outlined(
                  child: Column(
                    children: [
                      for (final entry in overview.projectsWithoutKr)
                        _ProjectEntryTile(entry: entry),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ObjectiveCard extends StatelessWidget {
  const _ObjectiveCard({required this.plan});

  final ObjectivePlan plan;

  @override
  Widget build(BuildContext context) {
    final objective = plan.objective;
    final theme = Theme.of(context);
    return Card.outlined(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ListTile(
            onTap: () => context.push(Routes.objective(objective.id)),
            leading: const Icon(Icons.flag_outlined),
            title: Text(objective.title, style: theme.textTheme.titleMedium),
            subtitle: Text(
              formatDateRange(objective.startDate, objective.endDate),
            ),
          ),
          const Divider(height: 1),
          if (plan.keyResults.isEmpty)
            const _Hint('No key results yet.')
          else
            for (final kr in plan.keyResults) ...[
              KeyResultTile(
                keyResult: kr.keyResult,
                progress: kr.progress,
                habitCheckIns: kr.habitCheckIns,
                effectiveDeadline: kr.effectiveDeadline,
                onTap: () => context.push(Routes.keyResult(kr.keyResult.id)),
              ),
              for (final entry in kr.projects)
                Padding(
                  padding: const EdgeInsets.only(left: 24),
                  child: _ProjectEntryTile(entry: entry),
                ),
            ],
          Align(
            alignment: Alignment.centerLeft,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(8, 0, 8, 4),
              child: TextButton.icon(
                onPressed: () =>
                    context.push(Routes.newKeyResult(objective.id)),
                icon: const Icon(Icons.add),
                label: const Text('Add key result'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProjectEntryTile extends StatelessWidget {
  const _ProjectEntryTile({required this.entry});

  final ProjectEntry entry;

  @override
  Widget build(BuildContext context) {
    return ProjectTile(
      project: entry.project,
      area: entry.area,
      deadline: entry.deadline,
      keyResultTitle: entry.keyResult?.title,
      onTap: () => context.push(Routes.projectDetail(entry.project.id)),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader(this.text);

  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(4, 16, 4, 8),
    child: Text(text, style: Theme.of(context).textTheme.titleSmall),
  );
}

class _Hint extends StatelessWidget {
  const _Hint(this.text);

  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    child: Text(
      text,
      style: Theme.of(context).textTheme.bodyMedium
          ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
    ),
  );
}
