import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/db/app_database.dart';
import '../../../core/router/routes.dart';
import '../../../core/time/date_format.dart';
import '../../../core/time/today.dart';
import '../../../core/widgets/async_body.dart';
import '../../../core/widgets/confirm_delete.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/form_sheet.dart';
import '../../../core/widgets/max_width_body.dart';
import '../../../core/widgets/orbit_chips.dart';
import '../../../core/widgets/section_heading.dart';
import '../../key_results/data/key_result_repository.dart';
import '../../key_results/domain/kr_deadline.dart';
import '../../key_results/domain/kr_progress.dart';
import '../../key_results/ui/key_result_form.dart';
import '../../key_results/ui/key_result_tile.dart';
import '../../areas/data/area_repository.dart';
import '../../plan/domain/plan_overview.dart';
import '../../plan/ui/objective_system.dart';
import '../../projects/data/project_repository.dart';
import '../../settings/data/settings_repository.dart';
import '../../tasks/data/task_repository.dart';
import '../../tasks/ui/task_tile.dart';
import '../data/objective_repository.dart';
import 'objective_form.dart';
import 'objective_labels.dart';

/// The objective page (objectives spec, "Objective page").
class ObjectiveScreen extends ConsumerWidget {
  const ObjectiveScreen({super.key, required this.objectiveId, this.onClose});

  final String objectiveId;

  /// Shown as a close button instead of back, when embedded in Plan's
  /// detail pane; also called after deleting.
  final VoidCallback? onClose;

  void _leave(BuildContext context) {
    if (onClose != null) {
      onClose!();
    } else if (context.canPop()) {
      context.pop();
    }
  }

  Future<void> _delete(
    BuildContext context,
    WidgetRef ref,
    Objective objective,
  ) async {
    final repo = ref.read(objectiveRepositoryProvider);
    final krCount = await repo.countKeyResults(objective.id);
    if (!context.mounted) return;
    final keyResults = krCount == 1 ? '1 key result' : '$krCount key results';
    final confirmed = await confirmDelete(
      context,
      title: 'Delete objective?',
      message:
          'This deletes "${objective.title}" and its $keyResults. Projects '
          'and habits linked to those key results keep existing without '
          'the link.',
    );
    if (!confirmed) return;
    await repo.delete(objective.id);
    if (context.mounted) _leave(context);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final objective = ref.watch(objectiveProvider(objectiveId)).value;
    final onClose = this.onClose;
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: onClose == null,
        leading: onClose == null
            ? null
            : IconButton(
                tooltip: 'Close',
                icon: const Icon(Icons.close),
                onPressed: onClose,
              ),
        title: const Text('Objective'),
        actions: [
          if (objective != null) ...[
            IconButton(
              tooltip: 'Edit objective',
              icon: const Icon(Icons.edit_outlined),
              onPressed: () async {
                final result = await showObjectiveForm(
                  context,
                  objectiveId: objective.id,
                );
                if (result == FormResult.deleted && context.mounted) {
                  _leave(context);
                }
              },
            ),
            IconButton(
              tooltip: 'Delete objective',
              icon: const Icon(Icons.delete_outline),
              onPressed: () => _delete(context, ref, objective),
            ),
          ],
        ],
      ),
      body: ObjectivePageBody(objectiveId: objectiveId),
    );
  }
}

/// The objective page's content without its scaffold; also shown in
/// Plan's detail pane on wide screens.
class ObjectivePageBody extends ConsumerWidget {
  const ObjectivePageBody({super.key, required this.objectiveId});

  final String objectiveId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AsyncBody(
      value: ref.watch(objectiveProvider(objectiveId)),
      data: (objective) => objective == null
          ? const EmptyState(
              icon: Icons.search_off,
              message: 'Objective not found',
            )
          : MaxWidthBody(
              child: ListView(
                padding: const EdgeInsets.only(bottom: 24),
                children: [
                  _Header(objective: objective),
                  _KeyResults(objective: objective),
                  _Tasks(objective: objective),
                ],
              ),
            ),
    );
  }
}

/// The objective with its KRs and their active projects, for its star
/// system and KR colors.
ObjectivePlan _objectivePlan(WidgetRef ref, Objective objective) {
  final checkIns = ref.watch(habitCheckInsProvider).value ?? const {};
  final areas = {
    for (final a in ref.watch(areasProvider).value ?? const <Area>[]) a.id: a,
  };
  final projects = ref.watch(activeProjectsProvider).value ?? const <Project>[];
  final keyResults = [
    for (final kr in ref.watch(keyResultsProvider).value ?? <KeyResult>[])
      if (kr.objectiveId == objective.id) kr,
  ]..sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
  return ObjectivePlan(
    objective: objective,
    keyResults: [
      for (final kr in keyResults)
        KeyResultPlan(
          keyResult: kr,
          effectiveDeadline: effectiveKrDeadline(
            kr.deadline,
            objective.endDate,
          ),
          progress: keyResultProgress(kr, habitCheckIns: checkIns[kr.id] ?? 0),
          habitCheckIns: checkIns[kr.id] ?? 0,
          projects: [
            for (final p in projects)
              if (p.keyResultId == kr.id)
                ProjectEntry(project: p, area: areas[p.areaId], deadline: null),
          ],
        ),
    ],
  );
}

class _Header extends ConsumerWidget {
  const _Header({required this.objective});

  final Objective objective;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final today = ref.watch(todayProvider);
    final leadDays =
        ref.watch(appSettingsProvider).value?.deadlineLeadDays ?? 7;
    final system = ObjectiveSystem(
      _objectivePlan(ref, objective),
      onKeyResult: (id) => context.push(Routes.keyResult(id)),
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (system.plan.keyResults.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: system.detailed(),
          ),
        Card(
          margin: const EdgeInsets.fromLTRB(16, 8, 16, 8),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        objective.title,
                        style: theme.textTheme.titleLarge,
                      ),
                    ),
                    if (system.plan.keyResults.isEmpty)
                      system.compact(size: 48),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  formatDateRange(objective.startDate, objective.endDate),
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    StatusChip<ObjectiveStatus>(
                      label: objectiveStatusLabel(objective.status),
                      color: objectiveStatusColor(context, objective.status),
                      options: [
                        for (final status in ObjectiveStatus.values)
                          if (status != objective.status)
                            (status, objectiveStatusLabel(status)),
                      ],
                      onSelected: (status) => ref
                          .read(objectiveRepositoryProvider)
                          .update(objective.copyWith(status: status)),
                    ),
                    if (objective.status == ObjectiveStatus.active)
                      DeadlineChip(
                        date: objective.endDate,
                        today: today,
                        leadDays: leadDays,
                      ),
                  ],
                ),
                if (objective.description.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(objective.description),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _KeyResults extends ConsumerWidget {
  const _KeyResults({required this.objective});

  final Objective objective;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final system = ObjectiveSystem(_objectivePlan(ref, objective));
    final keyResults = system.plan.keyResults;
    final today = ref.watch(todayProvider);
    final leadDays =
        ref.watch(appSettingsProvider).value?.deadlineLeadDays ?? 7;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionHeading(
          'Key results',
          action: TextButton.icon(
            onPressed: () =>
                showKeyResultForm(context, objectiveId: objective.id),
            icon: const Icon(Icons.add),
            label: const Text('Add key result'),
          ),
        ),
        if (keyResults.isEmpty)
          const SectionEmptyText(
            'No key results yet',
            icon: Icons.track_changes,
          ),
        for (final (i, kr) in keyResults.indexed)
          KeyResultTile(
            keyResult: kr.keyResult,
            progress: kr.progress,
            habitCheckIns: kr.habitCheckIns,
            effectiveDeadline: kr.effectiveDeadline,
            today: today,
            leadDays: leadDays,
            color: system.keyResult(i),
            onTap: () => context.push(Routes.keyResult(kr.keyResult.id)),
          ),
      ],
    );
  }
}

class _Tasks extends ConsumerWidget {
  const _Tasks({required this.objective});

  final Objective objective;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasks = [
      for (final t in ref.watch(assignedTasksProvider).value ?? <Task>[])
        if (t.objectiveId == objective.id) t,
    ];
    if (tasks.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionHeading('Tasks'),
        for (final task in tasks)
          TaskTile(key: ValueKey(task.id), task: task, isNextStep: false),
      ],
    );
  }
}
