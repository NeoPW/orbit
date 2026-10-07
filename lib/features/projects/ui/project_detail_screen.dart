import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/db/app_database.dart';
import '../../../core/router/routes.dart';
import '../../../core/time/today.dart';
import '../../../core/widgets/animated_items.dart';
import '../../../core/widgets/async_body.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/max_width_body.dart';
import '../../../core/widgets/orbit_chips.dart';
import '../../../core/widgets/section_heading.dart';
import '../../areas/data/area_repository.dart';
import '../../habits/data/habit_repository.dart';
import '../../habits/domain/habit_schedule.dart';
import '../../key_results/data/key_result_repository.dart';
import '../../log/data/log_repository.dart';
import '../../log/ui/log_entry_tile.dart';
import '../../log/ui/log_work_dialog.dart';
import '../../key_results/domain/kr_deadline.dart';
import '../../objectives/data/objective_repository.dart';
import '../../settings/data/settings_repository.dart';
import '../../tasks/data/task_repository.dart';
import '../../tasks/ui/task_dialog.dart';
import '../../tasks/ui/task_tile.dart';
import '../data/project_repository.dart';
import '../domain/project_deadline.dart';
import 'project_labels.dart';

/// Everything about one project: header with status, area, importance and
/// deadline, its tasks with the next step first, habits and logged work
/// (project-detail spec).
class ProjectDetailScreen extends ConsumerWidget {
  const ProjectDetailScreen({super.key, required this.projectId, this.onClose});

  final String projectId;

  /// Shown as a close button instead of back, when embedded in Plan's
  /// detail pane.
  final VoidCallback? onClose;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final project = ref.watch(projectProvider(projectId)).value;
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
        title: const Text('Project'),
        actions: [
          if (project != null)
            IconButton(
              tooltip: 'Edit project',
              icon: const Icon(Icons.edit_outlined),
              onPressed: () => context.push(Routes.project(project.id)),
            ),
        ],
      ),
      body: ProjectDetailBody(projectId: projectId),
    );
  }
}

/// The project detail without its scaffold; also shown in Plan's detail
/// pane on wide screens.
class ProjectDetailBody extends ConsumerWidget {
  const ProjectDetailBody({super.key, required this.projectId});

  final String projectId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AsyncBody(
      value: ref.watch(projectProvider(projectId)),
      data: (project) => project == null
          ? const EmptyState(
              icon: Icons.search_off,
              message: 'Project not found',
            )
          : MaxWidthBody(
              child: ListView(
                padding: const EdgeInsets.only(bottom: 24),
                children: [
                  _Header(project: project),
                  _TasksSection(project: project),
                  _HabitsSection(project: project),
                  _LogSection(project: project),
                ],
              ),
            ),
    );
  }
}

/// Title, status chip (tap to change), area, importance, deadline badge,
/// description and key result.
class _Header extends ConsumerWidget {
  const _Header({required this.project});

  final Project project;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final areas = ref.watch(areasProvider).value ?? const <Area>[];
    final keyResults =
        ref.watch(keyResultsProvider).value ?? const <KeyResult>[];
    final objectives =
        ref.watch(objectivesProvider).value ?? const <Objective>[];
    final today = ref.watch(todayProvider);
    final leadDays = ref.watch(appSettingsProvider).value?.deadlineLeadDays;

    final area = areas.where((a) => a.id == project.areaId).firstOrNull;
    final kr = keyResults.where((k) => k.id == project.keyResultId).firstOrNull;
    final objective = kr == null
        ? null
        : objectives.where((o) => o.id == kr.objectiveId).firstOrNull;
    final effective = effectiveProjectDeadline(
      project.deadline,
      kr == null || objective == null
          ? null
          : effectiveKrDeadline(kr.deadline, objective.endDate),
    );

    return Card(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(project.title, style: theme.textTheme.titleLarge),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                StatusChip<ProjectStatus>(
                  label: projectStatusLabel(project.status),
                  color: projectStatusColor(context, project.status),
                  options: [
                    for (final status in ProjectStatus.values)
                      if (status != project.status)
                        (status, projectStatusLabel(status)),
                  ],
                  onSelected: (status) => ref
                      .read(projectRepositoryProvider)
                      .setStatus(project.id, status),
                ),
                if (area != null) AreaChip(area: area),
                if (effective != null)
                  DeadlineChip(
                    date: effective.date,
                    today: today,
                    leadDays: leadDays ?? 7,
                    inherited: effective.inherited,
                  ),
                ImportanceDots(value: project.importance),
              ],
            ),
            if (project.description.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(project.description),
            ],
            if (kr != null) ...[
              const SizedBox(height: 12),
              ActionChip(
                avatar: const Icon(Icons.track_changes, size: 18),
                label: Text('Key result · ${kr.title}'),
                onPressed: () => context.push(Routes.keyResult(kr.id)),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// The open tasks, the next step first and marked (not shown twice).
class _TasksSection extends ConsumerWidget {
  const _TasksSection({required this.project});

  final Project project;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasks =
        ref.watch(projectOpenTasksProvider(project.id)).value ?? const <Task>[];
    final nextStepId = project.nextStepTaskId;
    final ordered = [
      ...tasks.where((t) => t.id == nextStepId),
      ...tasks.where((t) => t.id != nextStepId),
    ];
    final hasNextStep = ordered.any((t) => t.id == nextStepId);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionHeading(
          'Tasks',
          action: TextButton.icon(
            onPressed: () => showTaskDialog(context, projectId: project.id),
            icon: const Icon(Icons.add),
            label: const Text('Add task'),
          ),
        ),
        if (!hasNextStep)
          SectionEmptyText(
            'No next step',
            icon: Icons.flag_outlined,
            action: TextButton(
              onPressed: () => showTaskDialog(
                context,
                projectId: project.id,
                asNextStep: true,
              ),
              child: const Text('Set next step'),
            ),
          ),
        AnimatedItems(
          children: [
            for (final task in ordered)
              TaskTile(
                key: ValueKey(task.id),
                task: task,
                isNextStep: task.id == nextStepId,
              ),
          ],
        ),
      ],
    );
  }
}

class _HabitsSection extends ConsumerWidget {
  const _HabitsSection({required this.project});

  final Project project;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final habits = [
      for (final habit in ref.watch(habitsProvider).value ?? const <Habit>[])
        if (habit.projectId == project.id) habit,
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeading('Habits'),
        if (habits.isEmpty)
          const SectionEmptyText('No habits', icon: Icons.repeat),
        for (final habit in habits)
          ListTile(
            leading: const Icon(Icons.repeat),
            title: Text(habit.title),
            subtitle: Text(
              [
                scheduleSummary(
                  habit.scheduleType,
                  weekdays: habit.weekdays,
                  timesPerWeek: habit.timesPerWeek,
                ),
                if (!habit.active) 'Inactive',
              ].join(' · '),
            ),
            onTap: () => context.push(Routes.habit(habit.id)),
          ),
      ],
    );
  }
}

/// The project's log entries, most recent first.
class _LogSection extends ConsumerWidget {
  const _LogSection({required this.project});

  final Project project;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final entries =
        ref.watch(projectLogProvider(project.id)).value ?? const <LogEntry>[];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeading(
          'Log',
          action: TextButton.icon(
            onPressed: () => showLogWorkDialog(context, projectId: project.id),
            icon: const Icon(Icons.add),
            label: const Text('Log work'),
          ),
        ),
        if (entries.isEmpty)
          const SectionEmptyText('Nothing logged yet', icon: Icons.more_time),
        for (final entry in entries) LogEntryTile(entry: entry),
      ],
    );
  }
}
