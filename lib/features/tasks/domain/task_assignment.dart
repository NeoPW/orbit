import '../../../core/db/app_database.dart';

/// What a task belongs to: nothing (standalone), or exactly one project,
/// key result or objective (tasks spec, "Task assignment").
sealed class TaskAssignment {
  const TaskAssignment();

  /// The assignment stored on [task].
  factory TaskAssignment.of(Task task) => switch (task) {
    Task(:final projectId?) => InProject(projectId),
    Task(:final keyResultId?) => ForKeyResult(keyResultId),
    Task(:final objectiveId?) => ForObjective(objectiveId),
    _ => const Standalone(),
  };

  String? get projectId => null;
  String? get keyResultId => null;
  String? get objectiveId => null;
}

class Standalone extends TaskAssignment {
  const Standalone();

  @override
  bool operator ==(Object other) => other is Standalone;

  @override
  int get hashCode => 0;
}

class InProject extends TaskAssignment {
  const InProject(this.id);

  final String id;

  @override
  String get projectId => id;

  @override
  bool operator ==(Object other) => other is InProject && other.id == id;

  @override
  int get hashCode => Object.hash('project', id);
}

class ForKeyResult extends TaskAssignment {
  const ForKeyResult(this.id);

  final String id;

  @override
  String get keyResultId => id;

  @override
  bool operator ==(Object other) => other is ForKeyResult && other.id == id;

  @override
  int get hashCode => Object.hash('kr', id);
}

class ForObjective extends TaskAssignment {
  const ForObjective(this.id);

  final String id;

  @override
  String get objectiveId => id;

  @override
  bool operator ==(Object other) => other is ForObjective && other.id == id;

  @override
  int get hashCode => Object.hash('objective', id);
}
