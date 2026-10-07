import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/db/app_database.dart';
import '../../key_results/data/key_result_repository.dart';
import '../../objectives/data/objective_repository.dart';
import '../../projects/data/project_repository.dart';
import '../domain/task_assignment.dart';

/// What a task is assigned to, as shown to the user.
typedef AssignmentInfo = ({String kind, String title, IconData icon});

/// The assigned project, KR or objective of [assignment], or null when the
/// task is standalone or the item no longer exists.
AssignmentInfo? describeAssignment(
  TaskAssignment assignment, {
  required Map<String, Project> projects,
  required Map<String, KeyResult> keyResults,
  required Map<String, Objective> objectives,
}) => switch (assignment) {
  InProject(:final id) when projects[id] != null => (
    kind: 'Project',
    title: projects[id]!.title,
    icon: Icons.folder_outlined,
  ),
  ForKeyResult(:final id) when keyResults[id] != null => (
    kind: 'Key result',
    title: keyResults[id]!.title,
    icon: Icons.track_changes,
  ),
  ForObjective(:final id) when objectives[id] != null => (
    kind: 'Objective',
    title: objectives[id]!.title,
    icon: Icons.flag_outlined,
  ),
  _ => null,
};

/// Picks a task's assignment: none, an active project, a KR of an active
/// objective or an active objective. The current [value] stays selectable
/// even when its item is no longer active.
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
    final keyResults = ref.watch(keyResultsProvider).value ?? const [];
    final objectives = ref.watch(objectivesProvider).value ?? const [];
    final activeObjectives = {
      for (final o in objectives)
        if (o.status == ObjectiveStatus.active) o.id,
    };

    final options = <(TaskAssignment, String)>[
      (const Standalone(), 'No assignment'),
      for (final p in projects)
        if (p.status == ProjectStatus.active || value == InProject(p.id))
          (InProject(p.id), 'Project · ${p.title}'),
      for (final k in keyResults)
        if (activeObjectives.contains(k.objectiveId) ||
            value == ForKeyResult(k.id))
          (ForKeyResult(k.id), 'Key result · ${k.title}'),
      for (final o in objectives)
        if (activeObjectives.contains(o.id) || value == ForObjective(o.id))
          (ForObjective(o.id), 'Objective · ${o.title}'),
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
