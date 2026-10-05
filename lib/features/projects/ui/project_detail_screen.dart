import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/db/app_database.dart';
import '../../../core/router/routes.dart';
import '../../../core/time/date_format.dart';
import '../../../core/widgets/area_dot.dart';
import '../../../core/widgets/async_body.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/max_width_body.dart';
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
import '../../tasks/data/task_repository.dart';
import '../../tasks/ui/complete_task.dart';
import '../../tasks/ui/task_dialog.dart';
import '../../tasks/ui/task_tile.dart';
import '../data/project_repository.dart';
import '../domain/project_deadline.dart';
import 'project_labels.dart';
import 'project_tile.dart';

/// Everything about one project: its fields, next step and tasks, habits,
/// logged work and status actions (project-detail spec).
class ProjectDetailScreen extends ConsumerWidget {
  const ProjectDetailScreen({super.key, required this.projectId});

  final String projectId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final project = ref.watch(projectProvider(projectId));
    return AsyncBody(
      value: project,
      data: (project) => project == null
          ? Scaffold(
              appBar: AppBar(title: const Text('Project')),
              body: const EmptyState(
                icon: Icons.search_off,
                message: 'Project not found',
              ),
            )
          : _ProjectDetail(project: project),
    );
  }
}

class _ProjectDetail extends ConsumerWidget {
  const _ProjectDetail({required this.project});

  final Project project;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: Text(project.title),
        actions: [
          IconButton(
            tooltip: 'Edit project',
            icon: const Icon(Icons.edit_outlined),
            onPressed: () => context.push(Routes.project(project.id)),
          ),
        ],
      ),
      body: MaxWidthBody(
        child: ListView(
          padding: const EdgeInsets.only(bottom: 24),
          children: [
            _InfoSection(project: project),
            _StatusActions(project: project),
            _TasksSection(project: project),
            _HabitsSection(project: project),
            _LogSection(project: project),
          ],
        ),
      ),
    );
  }
}

class _InfoSection extends ConsumerWidget {
  const _InfoSection({required this.project});

  final Project project;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final areas = ref.watch(areasProvider).value ?? const <Area>[];
    final keyResults =
        ref.watch(keyResultsProvider).value ?? const <KeyResult>[];
    final objectives =
        ref.watch(objectivesProvider).value ?? const <Objective>[];

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
    final ownDeadline = project.deadline;

    Widget line(IconData icon, Widget child) => Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 18, color: theme.colorScheme.onSurfaceVariant),
          const SizedBox(width: 12),
          Expanded(child: child),
        ],
      ),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (project.description.isNotEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text(project.description),
          ),
        const SizedBox(height: 8),
        line(
          Icons.circle_outlined,
          Text('Status: ${projectStatusLabel(project.status)}'),
        ),
        line(
          Icons.label_outline,
          Row(
            children: [
              if (area != null) ...[
                AreaDot(color: area.color),
                const SizedBox(width: 6),
              ],
              Text(area?.name ?? 'No area'),
            ],
          ),
        ),
        line(
          Icons.track_changes,
          Text(kr == null ? 'No key result' : 'Key result: ${kr.title}'),
        ),
        line(Icons.star_outline, Text('Importance ${project.importance}')),
        line(
          Icons.event_outlined,
          Text(
            ownDeadline == null
                ? 'No own deadline'
                : 'Own deadline: ${formatDate(ownDeadline)}',
          ),
        ),
        line(
          Icons.event_available_outlined,
          Text('Effective: ${deadlineLabel(effective)}'),
        ),
      ],
    );
  }
}

/// The next step and the open tasks.
class _TasksSection extends ConsumerWidget {
  const _TasksSection({required this.project});

  final Project project;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final tasks =
        ref.watch(projectOpenTasksProvider(project.id)).value ?? const <Task>[];
    final nextStep = tasks
        .where((t) => t.id == project.nextStepTaskId)
        .firstOrNull;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeading('Next step'),
        if (nextStep == null)
          ListTile(
            title: Text(
              'No next step',
              style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
            ),
            trailing: TextButton(
              onPressed: () => showTaskDialog(
                context,
                projectId: project.id,
                asNextStep: true,
              ),
              child: const Text('Set next step'),
            ),
          )
        else
          ListTile(
            leading: Icon(Icons.flag, color: theme.colorScheme.primary),
            title: Text(nextStep.title),
            trailing: TextButton(
              onPressed: () =>
                  completeTask(context, ref, nextStep, isNextStep: true),
              child: const Text('Done'),
            ),
          ),
        SectionHeading(
          'Open tasks',
          action: TextButton.icon(
            onPressed: () => showTaskDialog(context, projectId: project.id),
            icon: const Icon(Icons.add),
            label: const Text('Add task'),
          ),
        ),
        if (tasks.isEmpty) SectionEmptyText('No open tasks'),
        for (final task in tasks)
          TaskTile(task: task, isNextStep: task.id == project.nextStepTaskId),
      ],
    );
  }
}

/// Buttons to move the project to every status except its current one.
class _StatusActions extends ConsumerWidget {
  const _StatusActions({required this.project});

  final Project project;

  static const _actions = [
    (ProjectStatus.active, 'Activate', Icons.play_arrow_outlined),
    (ProjectStatus.paused, 'Pause', Icons.pause_outlined),
    (ProjectStatus.backlog, 'Move to backlog', Icons.inventory_2_outlined),
    (ProjectStatus.completed, 'Complete', Icons.check_circle_outline),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          for (final (status, label, icon) in _actions)
            if (status != project.status)
              OutlinedButton.icon(
                onPressed: () => ref
                    .read(projectRepositoryProvider)
                    .setStatus(project.id, status),
                icon: Icon(icon),
                label: Text(label),
              ),
        ],
      ),
    );
  }
}

/// The habits linked to the project.
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
        if (habits.isEmpty) SectionEmptyText('No habits'),
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
        if (entries.isEmpty) SectionEmptyText('Nothing logged yet'),
        for (final entry in entries) LogEntryTile(entry: entry),
      ],
    );
  }
}
