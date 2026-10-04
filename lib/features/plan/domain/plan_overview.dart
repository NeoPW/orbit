import '../../../core/db/app_database.dart';
import '../../key_results/domain/kr_deadline.dart';
import '../../key_results/domain/kr_progress.dart';
import '../../projects/domain/project_deadline.dart';

/// The Plan tab's Overview: active objectives → KRs → active projects, and
/// the active projects without a KR (plan-overview spec).
class PlanOverview {
  const PlanOverview({
    required this.objectives,
    required this.projectsWithoutKr,
  });

  final List<ObjectivePlan> objectives;
  final List<ProjectEntry> projectsWithoutKr;
}

class ObjectivePlan {
  const ObjectivePlan({required this.objective, required this.keyResults});

  final Objective objective;
  final List<KeyResultPlan> keyResults;
}

class KeyResultPlan {
  const KeyResultPlan({
    required this.keyResult,
    required this.effectiveDeadline,
    required this.progress,
    required this.projects,
  });

  final KeyResult keyResult;
  final CalendarDate effectiveDeadline;

  /// 0–1, or null for habit KRs.
  final double? progress;
  final List<ProjectEntry> projects;
}

/// A project as shown in the Plan tab.
class ProjectEntry {
  const ProjectEntry({
    required this.project,
    required this.area,
    required this.deadline,
    this.keyResult,
  });

  final Project project;

  /// Null when the project has no area (or its area was deleted).
  final Area? area;

  /// Null when there is no deadline anywhere.
  final EffectiveDeadline? deadline;

  /// The linked KR, when it is shown outside its objective (its objective
  /// is not active). Null for entries listed under their KR.
  final KeyResult? keyResult;
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

/// Builds the Overview from non-deleted rows.
///
/// [objectives] and [keyResults] may include non-active objectives and their
/// KRs: they are needed for active projects linked to a KR of a non-active
/// objective, which are listed under "without KR" with their KR. Only
/// projects with status active are used from [projects].
PlanOverview buildPlanOverview({
  required List<Objective> objectives,
  required List<KeyResult> keyResults,
  required List<Project> projects,
  required List<Area> areas,
}) {
  final objectivesById = {for (final o in objectives) o.id: o};
  final areasById = {for (final a in areas) a.id: a};
  final krsById = {
    for (final kr in keyResults)
      if (objectivesById.containsKey(kr.objectiveId)) kr.id: kr,
  };

  CalendarDate krDeadline(KeyResult kr) =>
      effectiveKrDeadline(kr.deadline, objectivesById[kr.objectiveId]!.endDate);

  final projectsByKr = <String, List<ProjectEntry>>{};
  final withoutKr = <ProjectEntry>[];

  for (final project in projects) {
    if (project.status != ProjectStatus.active) continue;
    final kr = krsById[project.keyResultId];
    final area = areasById[project.areaId];
    final deadline = effectiveProjectDeadline(
      project.deadline,
      kr == null ? null : krDeadline(kr),
    );
    final underActiveObjective =
        kr != null &&
        objectivesById[kr.objectiveId]!.status == ObjectiveStatus.active;

    if (underActiveObjective) {
      projectsByKr
          .putIfAbsent(kr.id, () => [])
          .add(ProjectEntry(project: project, area: area, deadline: deadline));
    } else {
      withoutKr.add(
        ProjectEntry(
          project: project,
          area: area,
          deadline: deadline,
          keyResult: kr,
        ),
      );
    }
  }

  final activeObjectives =
      objectives.where((o) => o.status == ObjectiveStatus.active).toList()
        ..sort(_bySortOrder((o) => o.sortOrder, (o) => o.createdAt));

  final objectivePlans = [
    for (final objective in activeObjectives)
      ObjectivePlan(
        objective: objective,
        keyResults: [
          for (final kr
              in krsById.values
                  .where((kr) => kr.objectiveId == objective.id)
                  .toList()
                ..sort(_bySortOrder((k) => k.sortOrder, (k) => k.createdAt)))
            KeyResultPlan(
              keyResult: kr,
              effectiveDeadline: krDeadline(kr),
              progress: krProgress(
                kr.measureType,
                start: kr.startValue,
                target: kr.targetValue,
                current: kr.currentValue,
              ),
              projects: (projectsByKr[kr.id] ?? [])
                ..sort(compareProjectsForPlan),
            ),
        ],
      ),
  ];

  return PlanOverview(
    objectives: objectivePlans,
    projectsWithoutKr: withoutKr..sort(compareProjectsForPlan),
  );
}

int Function(T, T) _bySortOrder<T>(
  int Function(T) sortOrder,
  DateTime Function(T) createdAt,
) => (a, b) {
  final bySortOrder = sortOrder(a).compareTo(sortOrder(b));
  return bySortOrder != 0 ? bySortOrder : createdAt(a).compareTo(createdAt(b));
};
