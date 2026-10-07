import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/db/app_database.dart';
import '../../../core/time/today.dart';
import '../../../core/widgets/animated_items.dart';
import '../../../core/widgets/async_body.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/max_width_body.dart';
import '../../account/ui/sync_refresh.dart';
import '../../areas/data/area_repository.dart';
import '../../key_results/data/key_result_repository.dart';
import '../../key_results/domain/kr_deadline.dart';
import '../../objectives/data/objective_repository.dart';
import '../../projects/data/area_filter.dart';
import '../../projects/data/project_repository.dart';
import '../../projects/domain/project_deadline.dart';
import '../../projects/ui/project_tile.dart';
import '../data/plan_providers.dart';
import 'open_plan_item.dart';
import '../../settings/data/settings_repository.dart';

/// Backlog and paused projects, filterable by area, with "Activate".
class BacklogTab extends ConsumerStatefulWidget {
  const BacklogTab({super.key});

  @override
  ConsumerState<BacklogTab> createState() => _BacklogTabState();
}

class _BacklogTabState extends ConsumerState<BacklogTab> {
  AreaFilter _filter = const AllAreas();

  @override
  Widget build(BuildContext context) {
    final today = ref.watch(todayProvider);
    final leadDays =
        ref.watch(appSettingsProvider).value?.deadlineLeadDays ?? 7;
    final areas = ref.watch(areasProvider).value ?? const <Area>[];
    final areasById = {for (final a in areas) a.id: a};
    final objectivesById = {
      for (final o in ref.watch(objectivesProvider).value ?? <Objective>[])
        o.id: o,
    };
    final krsById = {
      for (final k in ref.watch(keyResultsProvider).value ?? <KeyResult>[])
        k.id: k,
    };

    EffectiveDeadline? deadlineOf(Project project) {
      final kr = krsById[project.keyResultId];
      final objective = kr == null ? null : objectivesById[kr.objectiveId];
      return effectiveProjectDeadline(
        project.deadline,
        kr == null || objective == null
            ? null
            : effectiveKrDeadline(kr.deadline, objective.endDate),
      );
    }

    Widget chip(String label, AreaFilter filter) => ChoiceChip(
      label: Text(label),
      selected: _filter == filter,
      onSelected: (_) => setState(() => _filter = filter),
    );

    return MaxWidthBody(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
            child: Row(
              children: [
                for (final (label, filter) in [
                  ('All', const AllAreas() as AreaFilter),
                  for (final area in areas) (area.name, InArea(area.id)),
                  ('No area', const NoArea()),
                ])
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: chip(label, filter),
                  ),
              ],
            ),
          ),
          Expanded(
            child: AsyncBody(
              value: ref.watch(backlogProjectsProvider(_filter)),
              data: (projects) => projects.isEmpty
                  ? const EmptyState(
                      icon: Icons.inventory_2_outlined,
                      message: 'No backlog or paused projects here',
                    )
                  : SyncRefresh(
                      child: ListView(
                        padding: const EdgeInsets.only(bottom: 88),
                        children: [
                          AnimatedItems(
                            children: [
                              for (final project in projects)
                                ProjectTile(
                                  key: ValueKey(project.id),
                                  project: project,
                                  area: areasById[project.areaId],
                                  deadline: deadlineOf(project),
                                  today: today,
                                  leadDays: leadDays,
                                  showStatus: true,
                                  onTap: () => openPlanItem(
                                    context,
                                    ref,
                                    PlanProject(project.id),
                                  ),
                                  trailing: TextButton(
                                    onPressed: () => ref
                                        .read(projectRepositoryProvider)
                                        .setStatus(
                                          project.id,
                                          ProjectStatus.active,
                                        ),
                                    child: const Text('Activate'),
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
