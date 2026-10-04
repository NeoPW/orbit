import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/async.dart';
import '../../../core/db/app_database.dart';
import '../../areas/data/area_repository.dart';
import '../../key_results/data/key_result_repository.dart';
import '../../objectives/data/objective_repository.dart';
import '../../projects/data/project_repository.dart';
import '../domain/plan_overview.dart';

part 'plan_providers.g.dart';

/// The Overview tab, updated after every relevant write.
@riverpod
AsyncValue<PlanOverview> planOverview(Ref ref) {
  final objectives = ref.watch(objectivesProvider);
  final keyResults = ref.watch(keyResultsProvider);
  final projects = ref.watch(activeProjectsProvider);
  final areas = ref.watch(areasProvider);
  return combineAsync(
    [objectives, keyResults, projects, areas],
    () => buildPlanOverview(
      objectives: objectives.requireValue,
      keyResults: keyResults.requireValue,
      projects: projects.requireValue,
      areas: areas.requireValue,
    ),
  );
}

/// An entry in the Archive.
sealed class ArchiveItem {
  const ArchiveItem();

  DateTime get updatedAt;
}

class ArchivedObjective extends ArchiveItem {
  const ArchivedObjective(this.objective);

  final Objective objective;

  @override
  DateTime get updatedAt => objective.updatedAt;
}

class ArchivedProject extends ArchiveItem {
  const ArchivedProject(this.project);

  final Project project;

  @override
  DateTime get updatedAt => project.updatedAt;
}

/// Completed/archived objectives and completed projects, most recently
/// updated first.
@riverpod
AsyncValue<List<ArchiveItem>> archive(Ref ref) {
  final objectives = ref.watch(objectivesProvider);
  final projects = ref.watch(completedProjectsProvider);
  return combineAsync([objectives, projects], () {
    final items = <ArchiveItem>[
      for (final o in objectives.requireValue)
        if (o.status != ObjectiveStatus.active) ArchivedObjective(o),
      for (final p in projects.requireValue) ArchivedProject(p),
    ];
    return items..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
  });
}
