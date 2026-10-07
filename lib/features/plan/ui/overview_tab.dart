import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/db/app_database.dart';
import '../../../core/router/routes.dart';
import '../../../core/time/date_format.dart';
import '../../../core/time/today.dart';
import '../../../core/widgets/animated_items.dart';
import '../../../core/widgets/async_body.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/max_width_body.dart';
import '../../../core/widgets/section_heading.dart';
import '../../account/ui/sync_refresh.dart';
import '../../key_results/ui/key_result_tile.dart';
import '../../projects/ui/project_tile.dart';
import '../../settings/data/settings_repository.dart';
import '../../tasks/ui/task_tile.dart';
import '../data/plan_providers.dart';
import '../domain/plan_overview.dart';
import 'open_plan_item.dart';

/// Active objectives → KRs → active projects and assigned tasks, then
/// active projects without a KR.
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
                  message: 'No active objectives',
                  action: FilledButton.tonal(
                    onPressed: () => context.push(Routes.newObjective),
                    child: const Text('Create objective'),
                  ),
                )
              else
                for (final objective in overview.objectives)
                  _ObjectiveCard(plan: objective),
              const SectionHeading('Projects without a KR'),
              if (overview.projectsWithoutKr.isEmpty)
                const SectionEmptyText(
                  'No active projects without a key result',
                  icon: Icons.folder_outlined,
                )
              else
                Card(
                  clipBehavior: Clip.antiAlias,
                  child: AnimatedItems(
                    children: [
                      for (final entry in overview.projectsWithoutKr)
                        _ProjectEntryTile(
                          key: ValueKey(entry.project.id),
                          entry: entry,
                        ),
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

class _ObjectiveCard extends ConsumerWidget {
  const _ObjectiveCard({required this.plan});

  final ObjectivePlan plan;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final objective = plan.objective;
    final theme = Theme.of(context);
    final today = ref.watch(todayProvider);
    final leadDays =
        ref.watch(appSettingsProvider).value?.deadlineLeadDays ?? 7;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ListTile(
            onTap: () => context.push(Routes.objective(objective.id)),
            leading: CircleAvatar(
              backgroundColor: theme.colorScheme.primaryContainer,
              foregroundColor: theme.colorScheme.onPrimaryContainer,
              child: const Icon(Icons.flag_outlined),
            ),
            title: Text(objective.title, style: theme.textTheme.titleMedium),
            subtitle: Text(
              formatDateRange(objective.startDate, objective.endDate),
            ),
          ),
          if (plan.tasks.isNotEmpty) _Tasks(tasks: plan.tasks),
          const Divider(height: 1),
          if (plan.keyResults.isEmpty)
            const Padding(
              padding: EdgeInsets.only(top: 8),
              child: SectionEmptyText(
                'No key results yet',
                icon: Icons.track_changes,
              ),
            )
          else
            for (final kr in plan.keyResults) ...[
              KeyResultTile(
                keyResult: kr.keyResult,
                progress: kr.progress,
                habitCheckIns: kr.habitCheckIns,
                effectiveDeadline: kr.effectiveDeadline,
                today: today,
                leadDays: leadDays,
                onTap: () => context.push(Routes.keyResult(kr.keyResult.id)),
              ),
              Padding(
                padding: const EdgeInsets.only(left: 40),
                child: AnimatedItems(
                  children: [
                    for (final entry in kr.projects)
                      _ProjectEntryTile(
                        key: ValueKey(entry.project.id),
                        entry: entry,
                      ),
                  ],
                ),
              ),
              if (kr.tasks.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(left: 40),
                  child: _Tasks(tasks: kr.tasks),
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

/// Open tasks assigned to an objective or KR.
class _Tasks extends ConsumerWidget {
  const _Tasks({required this.tasks});

  final List<Task> tasks;

  @override
  Widget build(BuildContext context, WidgetRef ref) => AnimatedItems(
    children: [
      for (final task in tasks)
        TaskTile(
          key: ValueKey(task.id),
          task: task,
          isNextStep: false,
          onTap: () => openPlanItem(context, ref, PlanTask(task.id)),
        ),
    ],
  );
}

class _ProjectEntryTile extends ConsumerWidget {
  const _ProjectEntryTile({super.key, required this.entry});

  final ProjectEntry entry;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ProjectTile(
      project: entry.project,
      area: entry.area,
      deadline: entry.deadline,
      today: ref.watch(todayProvider),
      leadDays: ref.watch(appSettingsProvider).value?.deadlineLeadDays ?? 7,
      keyResultTitle: entry.keyResult?.title,
      onTap: () => openPlanItem(context, ref, PlanProject(entry.project.id)),
    );
  }
}
