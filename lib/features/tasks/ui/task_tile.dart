import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/db/app_database.dart';
import '../../../core/router/routes.dart';
import '../../../core/time/today.dart';
import '../../../core/widgets/orbit_chips.dart';
import '../../settings/data/settings_repository.dart';
import 'complete_task.dart';

/// An open task row (tasks spec, "Task rows"): checkbox to complete it,
/// deadline badge and a marker when it is its project's next step. Tapping
/// opens the task page, where it can be edited, deleted or made the next
/// step.
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
      onTap: onTap ?? () => context.push(Routes.task(task.id)),
    );
  }
}
