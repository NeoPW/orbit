import '../../../core/db/app_database.dart';

/// Work counted for a goal: the number of log entries and their total
/// minutes (entries without a duration add none).
class WorkTotal {
  const WorkTotal(this.entries, this.minutes);

  static const none = WorkTotal(0, 0);

  final int entries;
  final int minutes;

  WorkTotal operator +(LogEntry entry) =>
      WorkTotal(entries + 1, minutes + (entry.durationMinutes ?? 0));

  @override
  bool operator ==(Object other) =>
      other is WorkTotal &&
      other.entries == entries &&
      other.minutes == minutes;

  @override
  int get hashCode => Object.hash(entries, minutes);

  @override
  String toString() => 'WorkTotal($entries, $minutes min)';
}

/// The goal a log entry counts for (goals spec, "Work on a goal"): its own
/// goal, else the current goal of its project, else that of its task (the
/// task's goal or its project's goal). Null when it serves no goal.
String? goalOfEntry(
  LogEntry entry, {
  required Map<String, String?> projectGoals,
  required Map<String, Task> tasks,
}) {
  if (entry.goalId != null) return entry.goalId;
  final projectGoal = projectGoals[entry.projectId];
  if (projectGoal != null) return projectGoal;
  final task = tasks[entry.taskId];
  if (task == null) return null;
  return task.goalId ?? projectGoals[task.projectId];
}

/// Work per goal ID over [entries] (filtered by the caller to a date range).
/// [projectGoals] maps every project ID to the goal it serves now.
Map<String, WorkTotal> workPerGoal(
  Iterable<LogEntry> entries, {
  required Map<String, String?> projectGoals,
  required Map<String, Task> tasks,
}) {
  final work = <String, WorkTotal>{};
  for (final entry in entries) {
    final goal = goalOfEntry(entry, projectGoals: projectGoals, tasks: tasks);
    if (goal == null) continue;
    work[goal] = (work[goal] ?? WorkTotal.none) + entry;
  }
  return work;
}
