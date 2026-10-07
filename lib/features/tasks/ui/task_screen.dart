import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/db/app_database.dart';
import '../../../core/router/routes.dart';
import '../../../core/time/today.dart';
import '../../../core/widgets/async_body.dart';
import '../../../core/widgets/confirm_delete.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/form_sheet.dart';
import '../../../core/widgets/max_width_body.dart';
import '../../../core/widgets/orbit_chips.dart';
import '../../../core/widgets/section_heading.dart';
import '../../key_results/data/key_result_repository.dart';
import '../../log/data/log_repository.dart';
import '../../log/ui/log_entry_tile.dart';
import '../../log/ui/log_work_dialog.dart';
import '../../objectives/data/objective_repository.dart';
import '../../projects/data/project_repository.dart';
import '../../settings/data/settings_repository.dart';
import '../data/task_repository.dart';
import '../domain/task_assignment.dart';
import 'assignment_picker.dart';
import 'complete_task.dart';
import 'task_form.dart';

/// The task page (tasks spec, "Task page").
class TaskScreen extends ConsumerWidget {
  const TaskScreen({super.key, required this.taskId, this.onClose});

  final String taskId;

  /// Shown as a close button instead of back, when embedded in Plan's
  /// detail pane; also called after deleting.
  final VoidCallback? onClose;

  Future<void> _delete(BuildContext context, WidgetRef ref, Task task) async {
    final tasks = ref.read(taskRepositoryProvider);
    final confirmed = await confirmDelete(
      context,
      title: 'Delete task?',
      message: 'This deletes "${task.title}". Its log entries stay.',
    );
    if (!confirmed) return;
    await tasks.delete(task.id);
    if (onClose != null) {
      onClose!();
    } else if (context.mounted && context.canPop()) {
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final task = ref.watch(taskProvider(taskId)).value;
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
        title: const Text('Task'),
        actions: [
          if (task != null) ...[
            IconButton(
              tooltip: 'Edit task',
              icon: const Icon(Icons.edit_outlined),
              onPressed: () async {
                final result = await showTaskForm(context, task: task);
                if (result != FormResult.deleted || !context.mounted) return;
                if (onClose != null) {
                  onClose();
                } else if (context.canPop()) {
                  context.pop();
                }
              },
            ),
            IconButton(
              tooltip: 'Delete task',
              icon: const Icon(Icons.delete_outline),
              onPressed: () => _delete(context, ref, task),
            ),
          ],
        ],
      ),
      body: TaskPageBody(taskId: taskId),
    );
  }
}

/// The task page's content without its scaffold; also shown in Plan's
/// detail pane on wide screens.
class TaskPageBody extends ConsumerWidget {
  const TaskPageBody({super.key, required this.taskId});

  final String taskId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AsyncBody(
      value: ref.watch(taskProvider(taskId)),
      data: (task) => task == null
          ? const EmptyState(icon: Icons.search_off, message: 'Task not found')
          : MaxWidthBody(
              child: ListView(
                padding: const EdgeInsets.only(bottom: 24),
                children: [
                  _Header(task: task),
                  _Actions(task: task),
                  if (task.notes.isNotEmpty) ...[
                    const SectionHeading('Notes'),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(task.notes),
                    ),
                  ],
                  _Log(task: task),
                ],
              ),
            ),
    );
  }
}

class _Header extends ConsumerWidget {
  const _Header({required this.task});

  final Task task;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final today = ref.watch(todayProvider);
    final leadDays = ref.watch(appSettingsProvider).value?.deadlineLeadDays;
    final projects = {
      for (final p in ref.watch(allProjectsProvider).value ?? const <Project>[])
        p.id: p,
    };
    final assignment = TaskAssignment.of(task);
    final info = describeAssignment(
      assignment,
      projects: projects,
      keyResults: {
        for (final k
            in ref.watch(keyResultsProvider).value ?? const <KeyResult>[])
          k.id: k,
      },
      objectives: {
        for (final o
            in ref.watch(objectivesProvider).value ?? const <Objective>[])
          o.id: o,
      },
    );
    final isNextStep = projects[task.projectId]?.nextStepTaskId == task.id;
    final done = task.status == TaskStatus.done;
    final due = task.dueDate;

    return Card(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              task.title,
              style: theme.textTheme.titleLarge?.copyWith(
                decoration: done ? TextDecoration.lineThrough : null,
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                StatusChip<void>(
                  label: done ? 'Done' : 'Open',
                  color: done ? colors.secondary : colors.primary,
                ),
                if (due != null && !done)
                  DeadlineChip(
                    date: due,
                    today: today,
                    leadDays: leadDays ?? 7,
                  ),
                if (isNextStep)
                  Chip(
                    avatar: Icon(Icons.flag, size: 16, color: colors.primary),
                    label: const Text('Next step'),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            if (info == null)
              Text('Standalone', style: theme.textTheme.bodySmall)
            else
              ActionChip(
                avatar: Icon(info.icon, size: 18),
                label: Text('${info.kind} · ${info.title}'),
                onPressed: () => context.push(switch (assignment) {
                  InProject(:final id) => Routes.projectDetail(id),
                  ForKeyResult(:final id) => Routes.keyResult(id),
                  ForObjective(:final id) => Routes.objective(id),
                  Standalone() => Routes.home,
                }),
              ),
            if (due != null && done) ...[
              const SizedBox(height: 8),
              DeadlineChip(date: due, today: today, leadDays: 0),
            ],
          ],
        ),
      ),
    );
  }
}

class _Actions extends ConsumerWidget {
  const _Actions({required this.task});

  final Task task;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final done = task.status == TaskStatus.done;
    final project = task.projectId == null
        ? null
        : ref.watch(projectProvider(task.projectId!)).value;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          if (done)
            OutlinedButton.icon(
              onPressed: () => ref.read(taskRepositoryProvider).reopen(task.id),
              icon: const Icon(Icons.replay),
              label: const Text('Reopen'),
            )
          else
            FilledButton.icon(
              onPressed: () => completeTask(
                context,
                ref,
                task,
                isNextStep: project?.nextStepTaskId == task.id,
              ),
              icon: const Icon(Icons.check),
              label: const Text('Complete'),
            ),
          OutlinedButton.icon(
            onPressed: () => showLogWorkDialog(
              context,
              projectId: task.projectId,
              keyResultId: task.keyResultId,
              taskId: task.id,
            ),
            icon: const Icon(Icons.more_time),
            label: const Text('Log work'),
          ),
          if (project != null && !done && project.nextStepTaskId != task.id)
            OutlinedButton.icon(
              onPressed: () => ref
                  .read(projectRepositoryProvider)
                  .setNextStep(project.id, task.id),
              icon: const Icon(Icons.flag_outlined),
              label: const Text('Make next step'),
            ),
        ],
      ),
    );
  }
}

class _Log extends ConsumerWidget {
  const _Log({required this.task});

  final Task task;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final entries =
        ref.watch(taskLogProvider(task.id)).value ?? const <LogEntry>[];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionHeading('Log'),
        if (entries.isEmpty)
          const SectionEmptyText('Nothing logged yet', icon: Icons.more_time),
        for (final entry in entries) LogEntryTile(entry: entry),
      ],
    );
  }
}
