import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/db/app_database.dart';
import '../../../core/router/routes.dart';
import '../../../core/time/today.dart';
import '../../../core/widgets/confirm_delete.dart';
import '../../../core/widgets/orbit_chips.dart';
import '../../projects/data/project_repository.dart';
import '../../settings/data/settings_repository.dart';
import '../data/task_repository.dart';
import 'complete_task.dart';
import 'task_dialog.dart';

enum _TaskAction { edit, makeNextStep, delete }

/// An open task: checkbox to complete it, deadline badge, a marker when it
/// is its project's next step, and a menu to edit, make it the next step
/// (project tasks only) or delete it. Tapping opens the task page.
class TaskTile extends ConsumerWidget {
  const TaskTile({
    super.key,
    required this.task,
    required this.isNextStep,
    this.onTap,
  });

  final Task task;
  final bool isNextStep;

  /// Replaces opening the task page.
  final VoidCallback? onTap;

  Future<void> _onAction(
    BuildContext context,
    WidgetRef ref,
    _TaskAction action,
  ) async {
    final projectId = task.projectId!;
    switch (action) {
      case _TaskAction.edit:
        await showTaskDialog(context, projectId: projectId, task: task);
      case _TaskAction.makeNextStep:
        await ref
            .read(projectRepositoryProvider)
            .setNextStep(projectId, task.id);
      case _TaskAction.delete:
        final tasks = ref.read(taskRepositoryProvider);
        final confirmed = await confirmDelete(
          context,
          title: 'Delete task?',
          message: isNextStep
              ? 'This deletes "${task.title}". The project will have no next '
                    'step.'
              : 'This deletes "${task.title}".',
        );
        if (confirmed) await tasks.delete(task.id);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final dueDate = task.dueDate;
    final details = [
      if (isNextStep)
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.flag, size: 14, color: theme.colorScheme.primary),
            const SizedBox(width: 4),
            Text(
              'Next step',
              style: theme.textTheme.labelMedium?.copyWith(
                color: theme.colorScheme.primary,
              ),
            ),
          ],
        ),
      if (dueDate != null)
        DeadlineChip(
          date: dueDate,
          today: ref.watch(todayProvider),
          leadDays: ref.watch(appSettingsProvider).value?.deadlineLeadDays ?? 7,
        ),
    ];
    return ListTile(
      leading: Checkbox(
        value: false,
        semanticLabel: 'Complete ${task.title}',
        onChanged: (_) =>
            completeTask(context, ref, task, isNextStep: isNextStep),
      ),
      title: Text(task.title),
      subtitle: details.isEmpty
          ? null
          : Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Wrap(
                spacing: 12,
                runSpacing: 4,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: details,
              ),
            ),
      trailing: PopupMenuButton<_TaskAction>(
        tooltip: 'Task actions',
        onSelected: (action) => _onAction(context, ref, action),
        itemBuilder: (context) => [
          const PopupMenuItem(value: _TaskAction.edit, child: Text('Edit')),
          if (!isNextStep && task.projectId != null)
            const PopupMenuItem(
              value: _TaskAction.makeNextStep,
              child: Text('Make next step'),
            ),
          const PopupMenuItem(value: _TaskAction.delete, child: Text('Delete')),
        ],
      ),
      onTap: onTap ?? () => context.push(Routes.task(task.id)),
    );
  }
}
