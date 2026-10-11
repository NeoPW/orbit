import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/db/app_database.dart';
import '../../../core/space/planets.dart';
import '../../../core/space/space_colors.dart';
import '../../../core/time/date_format.dart';
import '../../../core/time/today.dart';
import '../../../core/widgets/animated_items.dart';
import '../../../core/widgets/area_dot.dart';
import '../../../core/widgets/async_body.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/max_width_body.dart';
import '../../../core/widgets/orbit_chips.dart';
import '../../../core/widgets/section_heading.dart';
import '../../account/ui/sync_refresh.dart';
import '../../goals/ui/goal_form.dart';
import '../../goals/ui/measure_form.dart';
import '../../goals/ui/measure_tile.dart';
import '../../projects/ui/project_tile.dart';
import '../../settings/data/settings_repository.dart';
import '../../tasks/ui/task_tile.dart';
import '../data/plan_providers.dart';
import '../domain/plan_overview.dart';
import 'open_plan_item.dart';
import 'work_solar_system.dart';

/// Active goals with their measures, active projects and assigned tasks,
/// then the active projects without an active goal (plan-overview spec).
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
              WorkSolarSystem(
                onGoal: (id) => openPlanItem(context, ref, PlanGoal(id)),
                onProject: (id) => openPlanItem(context, ref, PlanProject(id)),
              ),
              if (overview.goals.isEmpty)
                EmptyState(
                  icon: Icons.flag_outlined,
                  message: 'No active goals',
                  action: FilledButton.tonal(
                    onPressed: () => showGoalForm(context),
                    child: const Text('Create goal'),
                  ),
                )
              else
                for (final goal in overview.goals) _GoalCard(plan: goal),
              const SectionHeading('Projects without a goal'),
              if (overview.projectsWithoutGoal.isEmpty)
                const SectionEmptyText(
                  'No active projects without a goal',
                  icon: Icons.folder_outlined,
                )
              else
                Card(
                  clipBehavior: Clip.antiAlias,
                  child: AnimatedItems(
                    children: [
                      for (final entry in overview.projectsWithoutGoal)
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

class _GoalCard extends ConsumerWidget {
  const _GoalCard({required this.plan});

  final GoalPlan plan;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final goal = plan.goal;
    final theme = Theme.of(context);
    final today = ref.watch(todayProvider);
    final leadDays =
        ref.watch(appSettingsProvider).value?.deadlineLeadDays ?? 7;
    final color = colorOfGoal(goal);
    final progress = plan.progress;
    void open() => openPlanItem(context, ref, PlanGoal(goal.id));
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ListTile(
            onTap: open,
            leading: GoalPlanet(
              color: color,
              progress: progress,
              ringed: plan.allReached,
              moons: [
                for (final entry in plan.projects)
                  entry.area == null
                      ? const Color(0xFFC9CEE8)
                      : colorFromHex(entry.area!.color),
              ],
              seed: stableSeed(goal.id),
            ),
            title: Text(goal.title, style: theme.textTheme.titleMedium),
            trailing: progress == null
                ? null
                : Text(
                    '${(progress * 100).round()} %',
                    style: theme.textTheme.titleSmall?.copyWith(color: color),
                  ),
            subtitle: Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Wrap(
                spacing: 8,
                runSpacing: 4,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  Text(formatDateRange(goal.startDate, goal.endDate)),
                  // Only active goals are listed here.
                  DeadlineChip(
                    date: goal.endDate,
                    today: today,
                    leadDays: leadDays,
                  ),
                ],
              ),
            ),
          ),
          _Measures(plan: plan, color: color, onOpen: open),
          if (plan.projects.isNotEmpty || plan.tasks.isNotEmpty)
            const Divider(height: 1),
          AnimatedItems(
            children: [
              for (final entry in plan.projects)
                _ProjectEntryTile(
                  key: ValueKey(entry.project.id),
                  entry: entry,
                ),
            ],
          ),
          if (plan.tasks.isNotEmpty) _Tasks(tasks: plan.tasks),
        ],
      ),
    );
  }
}

/// A goal's measures, collapsed to "N measures" until tapped; expanded
/// they show their progress and "Add measure".
class _Measures extends StatefulWidget {
  const _Measures({
    required this.plan,
    required this.color,
    required this.onOpen,
  });

  final GoalPlan plan;
  final Color color;
  final VoidCallback onOpen;

  @override
  State<_Measures> createState() => _MeasuresState();
}

class _MeasuresState extends State<_Measures> {
  var _expanded = false;

  @override
  Widget build(BuildContext context) {
    final plan = widget.plan;
    final count = plan.measures.length;
    final addMeasure = Align(
      alignment: Alignment.centerLeft,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(8, 0, 8, 4),
        child: TextButton.icon(
          onPressed: () => showMeasureForm(context, goalId: plan.goal.id),
          icon: const Icon(Icons.add),
          label: const Text('Add measure'),
        ),
      ),
    );
    if (count == 0) return addMeasure;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ListTile(
          dense: true,
          title: Text(count == 1 ? '1 measure' : '$count measures'),
          trailing: Icon(_expanded ? Icons.expand_less : Icons.expand_more),
          onTap: () => setState(() => _expanded = !_expanded),
        ),
        AnimatedSize(
          duration: const Duration(milliseconds: 200),
          alignment: Alignment.topCenter,
          child: _expanded
              ? Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    for (final m in plan.measures)
                      MeasureTile(
                        key: ValueKey(m.measure.id),
                        measure: m.measure,
                        progress: m.progress,
                        habitCheckIns: m.habitCheckIns,
                        color: widget.color,
                        onTap: widget.onOpen,
                      ),
                    addMeasure,
                  ],
                )
              : const SizedBox(width: double.infinity),
        ),
      ],
    );
  }
}

/// Open tasks assigned to a goal.
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
      goalTitle: entry.goal?.title,
      onTap: () => openPlanItem(context, ref, PlanProject(entry.project.id)),
    );
  }
}
