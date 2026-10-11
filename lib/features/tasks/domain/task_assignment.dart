import '../../../core/db/app_database.dart';

/// What a task belongs to: nothing (standalone), or exactly one project or
/// goal (tasks spec, "Assignment to a project or goal").
sealed class TaskAssignment {
  const TaskAssignment();

  /// The assignment stored on [task].
  factory TaskAssignment.of(Task task) => switch (task) {
    Task(:final projectId?) => InProject(projectId),
    Task(:final goalId?) => ForGoal(goalId),
    _ => const Standalone(),
  };

  String? get projectId => null;
  String? get goalId => null;
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

class ForGoal extends TaskAssignment {
  const ForGoal(this.id);

  final String id;

  @override
  String get goalId => id;

  @override
  bool operator ==(Object other) => other is ForGoal && other.id == id;

  @override
  int get hashCode => Object.hash('goal', id);
}
