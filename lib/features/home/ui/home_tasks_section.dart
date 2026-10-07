import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/routes.dart';
import '../../../core/time/today.dart';
import '../../../core/widgets/animated_items.dart';
import '../../../core/widgets/orbit_chips.dart';
import '../../../core/widgets/section_heading.dart';
import '../../settings/data/settings_repository.dart';
import '../../tasks/ui/complete_task.dart';
import '../../tasks/ui/task_form.dart';
import '../data/home_providers.dart';

/// "Tasks": open tasks outside projects (home spec, "Tasks on Home").
class HomeTasksSection extends ConsumerWidget {
  const HomeTasksSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasks = ref.watch(homeTasksProvider).value;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionHeading('Tasks'),
        if (tasks != null && tasks.isEmpty)
          SectionEmptyText(
            'No open tasks outside projects',
            icon: Icons.task_alt,
            action: TextButton(
              onPressed: () => showTaskForm(context),
              child: const Text('New task'),
            ),
          ),
        AnimatedItems(
          children: [
            for (final item in tasks ?? const <HomeTask>[])
              TaskCard(key: ValueKey(item.task.id), item: item),
          ],
        ),
      ],
    );
  }
}

/// A task on Home: checkbox, title, what it is assigned to and deadline.
class TaskCard extends ConsumerWidget {
  const TaskCard({super.key, required this.item});

  final HomeTask item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final task = item.task;
    final due = task.dueDate;
    final assignedTo = item.assignedTo;
    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.only(left: 4, right: 12),
        leading: Checkbox(
          value: false,
          semanticLabel: 'Complete ${task.title}',
          onChanged: (_) => completeTask(context, ref, task, isNextStep: false),
        ),
        title: Text(task.title),
        subtitle: assignedTo == null ? null : Text(assignedTo),
        trailing: due == null
            ? null
            : DeadlineChip(
                date: due,
                today: ref.watch(todayProvider),
                leadDays:
                    ref.watch(appSettingsProvider).value?.deadlineLeadDays ?? 7,
              ),
        onTap: () => context.push(Routes.task(task.id)),
      ),
    );
  }
}
