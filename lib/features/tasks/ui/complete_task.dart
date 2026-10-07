import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/db/app_database.dart';
import '../../../core/messages/messenger.dart';
import '../../projects/data/project_repository.dart';
import '../data/task_repository.dart';
import 'next_step_prompt.dart';

/// Completes [task] and offers Undo in a message at the top.
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
  final messenger = ref.read(messengerProvider.notifier);
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

  messenger.show(
    Message(
      'Task completed',
      icon: Icons.task_alt,
      action: MessageAction(
        'Undo',
        () => tasks.undoComplete(task.id, logEntryId),
      ),
    ),
  );
}
