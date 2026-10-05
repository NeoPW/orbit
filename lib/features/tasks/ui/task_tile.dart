import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/db/app_database.dart';
import '../../../core/time/date_format.dart';
import '../../../core/widgets/confirm_delete.dart';
import '../../projects/data/project_repository.dart';
import '../data/task_repository.dart';
import 'complete_task.dart';
import 'task_dialog.dart';

enum _TaskAction { edit, makeNextStep, delete }

/// An open task of a project: checkbox to complete it, due date, a marker
/// when it is the project's next step, and a menu to edit, make it the
/// next step or delete it.
class TaskTile extends ConsumerWidget {
  const TaskTile({super.key, required this.task, required this.isNextStep});

  final Task task;
  final bool isNextStep;

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
      if (dueDate != null) Text('Due ${formatDate(dueDate)}'),
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
          : Wrap(spacing: 12, runSpacing: 2, children: details),
      trailing: PopupMenuButton<_TaskAction>(
        tooltip: 'Task actions',
        onSelected: (action) => _onAction(context, ref, action),
        itemBuilder: (context) => [
          const PopupMenuItem(value: _TaskAction.edit, child: Text('Edit')),
          if (!isNextStep)
            const PopupMenuItem(
              value: _TaskAction.makeNextStep,
              child: Text('Make next step'),
            ),
          const PopupMenuItem(value: _TaskAction.delete, child: Text('Delete')),
        ],
      ),
      onTap: () =>
          showTaskDialog(context, projectId: task.projectId!, task: task),
    );
  }
}
