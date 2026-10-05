import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/db/app_database.dart';
import '../../projects/data/project_repository.dart';
import '../data/task_repository.dart';
import 'next_step_prompt.dart';

/// Completes [task] and offers Undo in a snackbar.
///
/// When the task is its project's next step ([isNextStep]), the next-step
/// prompt comes first; cancelling it changes nothing. Used by Home and the
/// project detail.
Future<void> completeTask(
  BuildContext context,
  WidgetRef ref,
  Task task, {
  required bool isNextStep,
}) async {
  // Read everything up front: the calling widget may be gone afterwards.
  final tasks = ref.read(taskRepositoryProvider);
  final projects = ref.read(projectRepositoryProvider);
  final messenger = ScaffoldMessenger.of(context);
  final projectId = task.projectId;

  final String logEntryId;
  if (isNextStep && projectId != null) {
    final open = await tasks.openForProject(projectId);
    if (!context.mounted) return;
    final choice = await showNextStepPrompt(
      context,
      done: task,
      openTasks: open,
    );
    if (choice == null) return;
    logEntryId = await projects.completeNextStep(projectId, choice);
  } else {
    logEntryId = await tasks.complete(task.id);
  }

  messenger
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(
        content: const Text('Task completed'),
        action: SnackBarAction(
          label: 'Undo',
          onPressed: () => tasks.undoComplete(task.id, logEntryId),
        ),
      ),
    );
}
