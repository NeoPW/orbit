import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/db/app_database.dart';
import '../../goals/data/goal_repository.dart';
import '../../projects/data/project_repository.dart';
import '../domain/task_assignment.dart';

/// What a task is assigned to, as shown to the user.
typedef AssignmentInfo = ({String kind, String title, IconData icon});

/// The assigned project or goal of [assignment], or null when the task is
/// standalone or the item no longer exists.
AssignmentInfo? describeAssignment(
  TaskAssignment assignment, {
  required Map<String, Project> projects,
  required Map<String, Goal> goals,
}) => switch (assignment) {
  InProject(:final id) when projects[id] != null => (
    kind: 'Project',
    title: projects[id]!.title,
    icon: Icons.folder_outlined,
  ),
  ForGoal(:final id) when goals[id] != null => (
    kind: 'Goal',
    title: goals[id]!.title,
    icon: Icons.flag_outlined,
  ),
  _ => null,
};

/// Picks a task's assignment: none, an active project or an active goal.
/// The current [value] stays selectable even when its item is no longer
/// active.
class AssignmentPicker extends ConsumerWidget {
  const AssignmentPicker({
    super.key,
    required this.value,
    required this.onChanged,
  });

  final TaskAssignment value;
  final ValueChanged<TaskAssignment> onChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projects = ref.watch(allProjectsProvider).value ?? const [];
    final goals = ref.watch(goalsProvider).value ?? const [];

    final options = <(TaskAssignment, String)>[
      (const Standalone(), 'No assignment'),
      for (final p in projects)
        if (p.status == ProjectStatus.active || value == InProject(p.id))
          (InProject(p.id), 'Project · ${p.title}'),
      for (final g in goals)
        if (g.status == GoalStatus.active || value == ForGoal(g.id))
          (ForGoal(g.id), 'Goal · ${g.title}'),
    ];
    final selected = options.any((o) => o.$1 == value)
        ? value
        : const Standalone();

    return DropdownButtonFormField<TaskAssignment>(
      // Rebuild when the options load.
      key: ValueKey('assignment-${options.length}'),
      initialValue: selected,
      isExpanded: true,
      decoration: const InputDecoration(labelText: 'Assigned to'),
      items: [
        for (final (assignment, label) in options)
          DropdownMenuItem(
            value: assignment,
            child: Text(label, overflow: TextOverflow.ellipsis),
          ),
      ],
      onChanged: (assignment) => onChanged(assignment ?? const Standalone()),
    );
  }
}
