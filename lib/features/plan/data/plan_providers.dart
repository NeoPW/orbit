import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/async.dart';
import '../../../core/db/app_database.dart';
import '../../areas/data/area_repository.dart';
import '../../goals/data/goal_repository.dart';
import '../../goals/data/measure_repository.dart';
import '../../projects/data/project_repository.dart';
import '../../tasks/data/task_repository.dart';
import '../domain/plan_overview.dart';

part 'plan_providers.g.dart';

/// The Overview tab, updated after every relevant write.
@riverpod
AsyncValue<PlanOverview> planOverview(Ref ref) {
  final goals = ref.watch(goalsProvider);
  final measures = ref.watch(measuresProvider);
  final projects = ref.watch(activeProjectsProvider);
  final areas = ref.watch(areasProvider);
  final checkIns = ref.watch(habitCheckInsProvider);
  final tasks = ref.watch(assignedTasksProvider);
  return combineAsync(
    [goals, measures, projects, areas, checkIns, tasks],
    () => buildPlanOverview(
      goals: goals.requireValue,
      measures: measures.requireValue,
      projects: projects.requireValue,
      areas: areas.requireValue,
      habitCheckIns: checkIns.requireValue,
      tasks: tasks.requireValue,
    ),
  );
}

/// A goal, project or task shown in Plan's detail pane on wide
/// screens.
sealed class PlanItem {
  const PlanItem(this.id);

  final String id;

  @override
  bool operator ==(Object other) =>
      other.runtimeType == runtimeType && other is PlanItem && other.id == id;

  @override
  int get hashCode => Object.hash(runtimeType, id);
}

class PlanProject extends PlanItem {
  const PlanProject(super.id);
}

class PlanTask extends PlanItem {
  const PlanTask(super.id);
}

class PlanGoal extends PlanItem {
  const PlanGoal(super.id);
}

/// The item in Plan's detail pane (visual-design spec, "Two panes on wide
/// screens"); kept while switching tabs.
@Riverpod(keepAlive: true)
class PlanSelection extends _$PlanSelection {
  @override
  PlanItem? build() => null;

  void select(PlanItem? item) => state = item;
}

/// An entry in the Archive.
sealed class ArchiveItem {
  const ArchiveItem();

  DateTime get updatedAt;
}

class ArchivedGoal extends ArchiveItem {
  const ArchivedGoal(this.goal);

  final Goal goal;

  @override
  DateTime get updatedAt => goal.updatedAt;
}

class ArchivedProject extends ArchiveItem {
  const ArchivedProject(this.project);

  final Project project;

  @override
  DateTime get updatedAt => project.updatedAt;
}

/// Completed/archived goals and completed projects, most recently updated
/// first.
@riverpod
AsyncValue<List<ArchiveItem>> archive(Ref ref) {
  final goals = ref.watch(goalsProvider);
  final projects = ref.watch(completedProjectsProvider);
  return combineAsync([goals, projects], () {
    final items = <ArchiveItem>[
      for (final g in goals.requireValue)
        if (g.status != GoalStatus.active) ArchivedGoal(g),
      for (final p in projects.requireValue) ArchivedProject(p),
    ];
    return items..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
  });
}
