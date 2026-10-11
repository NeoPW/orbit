import '../../../core/db/app_database.dart';
import '../../goals/domain/goal_progress.dart';
import '../../goals/domain/measure_progress.dart';
import '../../projects/domain/project_deadline.dart';

/// The Plan tab's Overview: the active goals with their measures, active
/// projects and assigned open tasks, and the active projects without an
/// active goal (plan-overview spec).
class PlanOverview {
  const PlanOverview({required this.goals, required this.projectsWithoutGoal});

  final List<GoalPlan> goals;
  final List<ProjectEntry> projectsWithoutGoal;
}

class GoalPlan {
  const GoalPlan({
    required this.goal,
    required this.measures,
    this.projects = const [],
    this.tasks = const [],
  });

  final Goal goal;

  /// In sort order.
  final List<MeasurePlan> measures;

  /// Active projects serving the goal, in Plan order.
  final List<ProjectEntry> projects;

  /// Open tasks assigned to the goal.
  final List<Task> tasks;

  /// The average of the measures, null without measures.
  double? get progress => goalProgress(measures.map((m) => m.progress));

  /// Every measure reached (the planet's ring).
  bool get allReached => allMeasuresReached(measures.map((m) => m.progress));
}

class MeasurePlan {
  const MeasurePlan({
    required this.measure,
    required this.progress,
    this.habitCheckIns = 0,
  });

  final Measure measure;

  /// 0–1.
  final double progress;

  /// Check-ins counted towards a habit measure; 0 for other measures.
  final int habitCheckIns;
}

/// A project as shown in the Plan tab.
class ProjectEntry {
  const ProjectEntry({
    required this.project,
    required this.area,
    required this.deadline,
    this.goal,
  });

  final Project project;

  /// Null when the project has no area (or its area was deleted).
  final Area? area;

  /// Null when there is no deadline anywhere.
  final EffectiveDeadline? deadline;

  /// The goal it serves, when it is shown outside that goal (the goal is not
  /// active). Null for entries listed under their goal.
  final Goal? goal;
}

/// Plan-tab ordering: importance (highest first), then effective deadline
/// (earliest first, none last), then title (case-insensitive).
int compareProjectsForPlan(ProjectEntry a, ProjectEntry b) {
  final byImportance = b.project.importance.compareTo(a.project.importance);
  if (byImportance != 0) return byImportance;

  final aDate = a.deadline?.date;
  final bDate = b.deadline?.date;
  if (aDate != null && bDate != null) {
    final byDate = aDate.compareTo(bDate);
    if (byDate != 0) return byDate;
  } else if (aDate != null) {
    return -1;
  } else if (bDate != null) {
    return 1;
  }

  return a.project.title.toLowerCase().compareTo(b.project.title.toLowerCase());
}

/// Assigned tasks in Plan: deadline (earliest first, none last), then title
/// (case-insensitive).
int compareTasksForPlan(Task a, Task b) {
  final aDate = a.dueDate;
  final bDate = b.dueDate;
  if (aDate != null && bDate != null) {
    final byDate = aDate.compareTo(bDate);
    if (byDate != 0) return byDate;
  } else if (aDate != null) {
    return -1;
  } else if (bDate != null) {
    return 1;
  }
  return a.title.toLowerCase().compareTo(b.title.toLowerCase());
}

/// The measures of [goal] in sort order with their progress.
/// [habitCheckIns] holds the check-ins counted towards each habit measure.
List<MeasurePlan> measurePlans(
  Goal goal,
  Iterable<Measure> measures, {
  Map<String, int> habitCheckIns = const {},
}) => [
  for (final measure
      in measures.where((m) => m.goalId == goal.id).toList()
        ..sort(_bySortOrder((m) => m.sortOrder, (m) => m.createdAt)))
    MeasurePlan(
      measure: measure,
      progress: measureProgress(
        measure,
        habitCheckIns: habitCheckIns[measure.id] ?? 0,
      ),
      habitCheckIns: habitCheckIns[measure.id] ?? 0,
    ),
];

/// Builds the Overview from non-deleted rows.
///
/// [goals] may include non-active goals: active projects serving them are
/// listed under "without a goal" with the goal's title. Only projects with
/// status active are used from [projects]. Open tasks in [tasks] are listed
/// under the goal they are assigned to; others are ignored.
PlanOverview buildPlanOverview({
  required List<Goal> goals,
  required List<Measure> measures,
  required List<Project> projects,
  required List<Area> areas,
  Map<String, int> habitCheckIns = const {},
  List<Task> tasks = const [],
}) {
  final goalsById = {for (final g in goals) g.id: g};
  final areasById = {for (final a in areas) a.id: a};

  final projectsByGoal = <String, List<ProjectEntry>>{};
  final withoutGoal = <ProjectEntry>[];

  for (final project in projects) {
    if (project.status != ProjectStatus.active) continue;
    final goal = goalsById[project.goalId];
    final area = areasById[project.areaId];
    final deadline = effectiveProjectDeadline(project.deadline, goal?.endDate);
    if (goal != null && goal.status == GoalStatus.active) {
      projectsByGoal
          .putIfAbsent(goal.id, () => [])
          .add(ProjectEntry(project: project, area: area, deadline: deadline));
    } else {
      withoutGoal.add(
        ProjectEntry(
          project: project,
          area: area,
          deadline: deadline,
          goal: goal,
        ),
      );
    }
  }

  final openTasks = tasks.where((t) => t.status == TaskStatus.open).toList()
    ..sort(compareTasksForPlan);

  final activeGoals = goals.where((g) => g.status == GoalStatus.active).toList()
    ..sort(_bySortOrder((g) => g.sortOrder, (g) => g.createdAt));

  return PlanOverview(
    goals: [
      for (final goal in activeGoals)
        GoalPlan(
          goal: goal,
          measures: measurePlans(goal, measures, habitCheckIns: habitCheckIns),
          projects: (projectsByGoal[goal.id] ?? [])
            ..sort(compareProjectsForPlan),
          tasks: openTasks.where((t) => t.goalId == goal.id).toList(),
        ),
    ],
    projectsWithoutGoal: withoutGoal..sort(compareProjectsForPlan),
  );
}

int Function(T, T) _bySortOrder<T>(
  int Function(T) sortOrder,
  DateTime Function(T) createdAt,
) => (a, b) {
  final bySortOrder = sortOrder(a).compareTo(sortOrder(b));
  return bySortOrder != 0 ? bySortOrder : createdAt(a).compareTo(createdAt(b));
};
