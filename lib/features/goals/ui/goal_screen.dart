import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/db/app_database.dart';
import '../../../core/router/routes.dart';
import '../../../core/space/planets.dart';
import '../../../core/space/space_colors.dart';
import '../../../core/time/date_format.dart';
import '../../../core/time/today.dart';
import '../../../core/widgets/area_dot.dart';
import '../../../core/widgets/async_body.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/form_sheet.dart';
import '../../../core/widgets/max_width_body.dart';
import '../../../core/widgets/orbit_chips.dart';
import '../../../core/widgets/section_heading.dart';
import '../../areas/data/area_repository.dart';
import '../../habits/data/habit_repository.dart';
import '../../habits/domain/habit_schedule.dart';
import '../../habits/ui/habit_form.dart';
import '../../log/data/log_repository.dart';
import '../../log/domain/duration.dart';
import '../../log/ui/log_entry_tile.dart';
import '../../plan/domain/plan_overview.dart';
import '../../projects/data/project_repository.dart';
import '../../projects/domain/project_deadline.dart';
import '../../projects/ui/project_form.dart';
import '../../projects/ui/project_tile.dart';
import '../../settings/data/settings_repository.dart';
import '../../tasks/data/task_repository.dart';
import '../../tasks/ui/task_tile.dart';
import '../data/goal_repository.dart';
import '../data/measure_repository.dart';
import '../domain/goal_progress.dart';
import 'goal_form.dart';
import 'goal_labels.dart';
import 'measure_form.dart';
import 'measure_row.dart';

/// The goal page (goals spec, "Goal page").
class GoalScreen extends ConsumerWidget {
  const GoalScreen({super.key, required this.goalId, this.onClose});

  final String goalId;

  /// Shown as a close button instead of back, when embedded in Plan's
  /// detail pane; also called after deleting.
  final VoidCallback? onClose;

  void _leave(BuildContext context) {
    if (onClose != null) {
      onClose!();
    } else if (context.canPop()) {
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final goal = ref.watch(goalProvider(goalId)).value;
    final onClose = this.onClose;
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: onClose == null,
        leading: onClose == null
            ? null
            : IconButton(
                tooltip: 'Close',
                icon: const Icon(Icons.close),
                onPressed: onClose,
              ),
        title: const Text('Goal'),
        actions: [
          if (goal != null) ...[
            IconButton(
              tooltip: 'Edit goal',
              icon: const Icon(Icons.edit_outlined),
              onPressed: () async {
                final result = await showGoalForm(context, goalId: goal.id);
                if (result == FormResult.deleted && context.mounted) {
                  _leave(context);
                }
              },
            ),
            IconButton(
              tooltip: 'Delete goal',
              icon: const Icon(Icons.delete_outline),
              onPressed: () async {
                if (await deleteGoal(context, ref, goal) && context.mounted) {
                  _leave(context);
                }
              },
            ),
          ],
        ],
      ),
      body: GoalPageBody(goalId: goalId),
    );
  }
}

/// The goal page's content without its scaffold; also shown in Plan's
/// detail pane on wide screens.
class GoalPageBody extends ConsumerWidget {
  const GoalPageBody({super.key, required this.goalId});

  final String goalId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AsyncBody(
      value: ref.watch(goalProvider(goalId)),
      data: (goal) => goal == null
          ? const EmptyState(icon: Icons.search_off, message: 'Goal not found')
          : MaxWidthBody(
              child: ListView(
                padding: const EdgeInsets.only(bottom: 24),
                children: [
                  _Header(goal: goal),
                  _Measures(goal: goal),
                  _Projects(goal: goal),
                  _TasksAndHabits(goal: goal),
                  _Work(goal: goal),
                ],
              ),
            ),
    );
  }
}

/// The goal's measures in order with their progress.
List<MeasurePlan> _measuresOf(WidgetRef ref, Goal goal) => measurePlans(
  goal,
  ref.watch(measuresProvider).value ?? const <Measure>[],
  habitCheckIns: ref.watch(habitCheckInsProvider).value ?? const {},
);

/// The projects serving the goal (any status but deleted).
List<Project> _projectsOf(WidgetRef ref, Goal goal) => [
  for (final p in ref.watch(allProjectsProvider).value ?? const <Project>[])
    if (p.goalId == goal.id) p,
];

class _Header extends ConsumerWidget {
  const _Header({required this.goal});

  final Goal goal;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final today = ref.watch(todayProvider);
    final leadDays =
        ref.watch(appSettingsProvider).value?.deadlineLeadDays ?? 7;
    final areas = {
      for (final a in ref.watch(areasProvider).value ?? const <Area>[]) a.id: a,
    };
    final measures = _measuresOf(ref, goal);
    final progress = goalProgress(measures.map((m) => m.progress));
    final moons = [
      for (final p in _projectsOf(ref, goal))
        if (p.status == ProjectStatus.active)
          switch (areas[p.areaId]) {
            final area? => colorFromHex(area.color),
            null => const Color(0xFFC9CEE8),
          },
    ];
    return Card(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(goal.title, style: theme.textTheme.titleLarge),
                      const SizedBox(height: 4),
                      Text(
                        formatDateRange(goal.startDate, goal.endDate),
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                      if (progress != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          '${(progress * 100).round()} %',
                          style: theme.textTheme.titleMedium?.copyWith(
                            color: colorOfGoal(goal),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                GoalPlanet(
                  color: colorOfGoal(goal),
                  progress: progress,
                  ringed: allMeasuresReached(measures.map((m) => m.progress)),
                  moons: moons,
                  seed: stableSeed(goal.id),
                  size: 96,
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                StatusChip<GoalStatus>(
                  label: goalStatusLabel(goal.status),
                  color: goalStatusColor(context, goal.status),
                  options: [
                    for (final status in GoalStatus.values)
                      if (status != goal.status)
                        (status, goalStatusLabel(status)),
                  ],
                  onSelected: (status) => ref
                      .read(goalRepositoryProvider)
                      .update(goal.copyWith(status: status)),
                ),
                if (goal.status == GoalStatus.active)
                  DeadlineChip(
                    date: goal.endDate,
                    today: today,
                    leadDays: leadDays,
                  ),
              ],
            ),
            if (goal.description.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(goal.description),
            ],
          ],
        ),
      ),
    );
  }
}

class _Measures extends ConsumerWidget {
  const _Measures({required this.goal});

  final Goal goal;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final measures = _measuresOf(ref, goal);
    final color = colorOfGoal(goal);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionHeading(
          'Measures',
          action: TextButton.icon(
            onPressed: () => showMeasureForm(context, goalId: goal.id),
            icon: const Icon(Icons.add),
            label: const Text('Add measure'),
          ),
        ),
        if (measures.isEmpty)
          const SectionEmptyText('No measures yet', icon: Icons.track_changes),
        for (final m in measures)
          MeasureRow(
            key: ValueKey(m.measure.id),
            measure: m.measure,
            progress: m.progress,
            habitCheckIns: m.habitCheckIns,
            color: color,
          ),
      ],
    );
  }
}

class _Projects extends ConsumerWidget {
  const _Projects({required this.goal});

  final Goal goal;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final areas = {
      for (final a in ref.watch(areasProvider).value ?? const <Area>[]) a.id: a,
    };
    final today = ref.watch(todayProvider);
    final leadDays =
        ref.watch(appSettingsProvider).value?.deadlineLeadDays ?? 7;
    final projects = _projectsOf(ref, goal);
    ProjectEntry entry(Project p) => ProjectEntry(
      project: p,
      area: areas[p.areaId],
      deadline: effectiveProjectDeadline(p.deadline, goal.endDate),
    );
    final active = [
      for (final p in projects)
        if (p.status == ProjectStatus.active) entry(p),
    ]..sort(compareProjectsForPlan);
    final waiting = [
      for (final p in projects)
        if (p.status == ProjectStatus.backlog ||
            p.status == ProjectStatus.paused)
          entry(p),
    ]..sort(compareProjectsForPlan);
    final completed = projects
        .where((p) => p.status == ProjectStatus.completed)
        .length;

    Widget tile(ProjectEntry e, {required bool showStatus}) => ProjectTile(
      key: ValueKey(e.project.id),
      project: e.project,
      area: e.area,
      deadline: e.deadline,
      today: today,
      leadDays: leadDays,
      showStatus: showStatus,
      onTap: () => context.push(Routes.projectDetail(e.project.id)),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionHeading(
          'Projects',
          action: TextButton.icon(
            onPressed: () => showProjectForm(context, goalId: goal.id),
            icon: const Icon(Icons.add),
            label: const Text('Add project'),
          ),
        ),
        if (active.isEmpty && waiting.isEmpty)
          const SectionEmptyText(
            'No projects for this goal',
            icon: Icons.folder_outlined,
          ),
        for (final e in active) tile(e, showStatus: false),
        for (final e in waiting) tile(e, showStatus: true),
        if (completed > 0)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
            child: Text(
              '$completed completed',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ),
      ],
    );
  }
}

class _TasksAndHabits extends ConsumerWidget {
  const _TasksAndHabits({required this.goal});

  final Goal goal;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasks = [
      for (final t in ref.watch(assignedTasksProvider).value ?? const <Task>[])
        if (t.goalId == goal.id) t,
    ];
    final habits = [
      for (final h in ref.watch(habitsProvider).value ?? const <Habit>[])
        if (h.goalId == goal.id) h,
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (tasks.isNotEmpty) ...[
          const SectionHeading('Tasks'),
          for (final task in tasks)
            TaskTile(key: ValueKey(task.id), task: task, isNextStep: false),
        ],
        if (habits.isNotEmpty) ...[
          const SectionHeading('Habits'),
          for (final habit in habits)
            ListTile(
              leading: const Icon(Icons.repeat),
              title: Text(habit.title),
              subtitle: Text(
                scheduleSummary(
                  habit.scheduleType,
                  weekdays: habit.weekdays,
                  timesPerWeek: habit.timesPerWeek,
                ),
              ),
              onTap: () => showHabitForm(context, habitId: habit.id),
            ),
        ],
      ],
    );
  }
}

/// Work on the goal: this week and in total, and the latest entries (goals
/// spec, "Work on a goal").
class _Work extends ConsumerWidget {
  const _Work({required this.goal});

  final Goal goal;

  static const _recent = 10;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final entries =
        ref.watch(goalLogProvider(goal.id)).value ?? const <LogEntry>[];
    final weekStart = ref.watch(todayProvider).weekStart;
    final from = weekStart.toLocalDateTime().toUtc();
    final thisWeek = entries.where((e) => !e.occurredAt.isBefore(from));

    String summary(Iterable<LogEntry> list) {
      final minutes = list.fold(0, (sum, e) => sum + (e.durationMinutes ?? 0));
      final count = list.length == 1 ? '1 entry' : '${list.length} entries';
      return minutes == 0 ? count : '$count · ${formatDuration(minutes)}';
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionHeading('Work'),
        if (entries.isEmpty)
          const SectionEmptyText('Nothing logged yet', icon: Icons.more_time)
        else ...[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Wrap(
              spacing: 24,
              runSpacing: 4,
              children: [
                Text.rich(
                  TextSpan(
                    text: 'This week  ',
                    style: theme.textTheme.labelMedium,
                    children: [
                      TextSpan(
                        text: summary(thisWeek),
                        style: theme.textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
                Text.rich(
                  TextSpan(
                    text: 'Total  ',
                    style: theme.textTheme.labelMedium,
                    children: [
                      TextSpan(
                        text: summary(entries),
                        style: theme.textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 4),
          for (final entry in entries.take(_recent))
            LogEntryTile(key: ValueKey(entry.id), entry: entry),
        ],
      ],
    );
  }
}
