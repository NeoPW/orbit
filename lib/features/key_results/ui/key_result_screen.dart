import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/db/app_database.dart';
import '../../../core/numbers.dart';
import '../../../core/router/routes.dart';
import '../../../core/time/today.dart';
import '../../../core/widgets/async_body.dart';
import '../../../core/widgets/confirm_delete.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/form_sheet.dart';
import '../../../core/widgets/max_width_body.dart';
import '../../../core/widgets/orbit_chips.dart';
import '../../../core/widgets/orbit_ring.dart';
import '../../../core/widgets/section_heading.dart';
import '../../areas/data/area_repository.dart';
import '../../habits/data/habit_repository.dart';
import '../../habits/domain/habit_schedule.dart';
import '../../habits/ui/habit_form.dart';
import '../../log/data/log_repository.dart';
import '../../log/ui/log_entry_tile.dart';
import '../../objectives/data/objective_repository.dart';
import '../../projects/data/project_repository.dart';
import '../../projects/domain/project_deadline.dart';
import '../../projects/ui/project_tile.dart';
import '../../settings/data/settings_repository.dart';
import '../../tasks/data/task_repository.dart';
import '../../tasks/ui/task_tile.dart';
import '../data/key_result_repository.dart';
import '../domain/kr_deadline.dart';
import '../domain/kr_progress.dart';
import 'key_result_form.dart';
import 'key_result_tile.dart';

/// The KR page (key-results spec, "Key result page").
class KeyResultScreen extends ConsumerWidget {
  const KeyResultScreen({super.key, required this.keyResultId, this.onClose});

  final String keyResultId;

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
    KeyResult kr,
  ) async {
    final confirmed = await confirmDelete(
      context,
      title: 'Delete key result?',
      message:
          'This deletes "${kr.title}". Projects and habits linked to it keep '
          'existing without the link.',
    );
    if (!confirmed) return;
    await ref.read(keyResultRepositoryProvider).delete(kr.id);
    if (context.mounted) _leave(context);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final kr = ref.watch(keyResultProvider(keyResultId)).value;
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
        title: const Text('Key result'),
        actions: [
          if (kr != null) ...[
            IconButton(
              tooltip: 'Edit key result',
              icon: const Icon(Icons.edit_outlined),
              onPressed: () async {
                final result = await showKeyResultForm(
                  context,
                  keyResultId: kr.id,
                );
                if (result == FormResult.deleted && context.mounted) {
                  _leave(context);
                }
              },
            ),
            IconButton(
              tooltip: 'Delete key result',
              icon: const Icon(Icons.delete_outline),
              onPressed: () => _delete(context, ref, kr),
            ),
          ],
        ],
      ),
      body: KeyResultPageBody(keyResultId: keyResultId),
    );
  }
}

/// The KR page's content without its scaffold; also shown in Plan's
/// detail pane on wide screens.
class KeyResultPageBody extends ConsumerWidget {
  const KeyResultPageBody({super.key, required this.keyResultId});

  final String keyResultId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AsyncBody(
      value: ref.watch(keyResultProvider(keyResultId)),
      data: (kr) => kr == null
          ? const EmptyState(
              icon: Icons.search_off,
              message: 'Key result not found',
            )
          : MaxWidthBody(
              child: ListView(
                padding: const EdgeInsets.only(bottom: 24),
                children: [
                  _Header(kr: kr),
                  _ProgressControls(kr: kr),
                  _Projects(kr: kr),
                  _Tasks(kr: kr),
                  _Habits(kr: kr),
                  _Log(kr: kr),
                ],
              ),
            ),
    );
  }
}

class _Header extends ConsumerWidget {
  const _Header({required this.kr});

  final KeyResult kr;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final checkIns = ref.watch(habitCheckInsProvider).value?[kr.id] ?? 0;
    final progress = keyResultProgress(kr, habitCheckIns: checkIns);
    final objective = ref.watch(objectiveProvider(kr.objectiveId)).value;
    final today = ref.watch(todayProvider);
    final leadDays =
        ref.watch(appSettingsProvider).value?.deadlineLeadDays ?? 7;
    final done = progress >= 1;

    return Card(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                OrbitRing(
                  progress: progress,
                  size: 72,
                  strokeWidth: 6,
                  label: '${(progress * 100).round()}%',
                  color: done ? theme.colorScheme.secondary : null,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(kr.title, style: theme.textTheme.titleLarge),
                      const SizedBox(height: 4),
                      Text(
                        krValueText(
                          kr,
                          progress: progress,
                          habitCheckIns: checkIns,
                        ),
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                if (objective != null && !done)
                  DeadlineChip(
                    date: effectiveKrDeadline(kr.deadline, objective.endDate),
                    today: today,
                    leadDays: leadDays,
                  ),
                if (objective != null)
                  ActionChip(
                    avatar: const Icon(Icons.flag_outlined, size: 18),
                    label: Text('Objective · ${objective.title}'),
                    onPressed: () =>
                        context.push(Routes.objective(objective.id)),
                  ),
              ],
            ),
            if (kr.description.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(kr.description),
            ],
          ],
        ),
      ),
    );
  }
}

/// − / + and the value for numeric KRs, a done switch for boolean ones,
/// the linked habit for habit KRs (key-results spec, "Progress controls").
class _ProgressControls extends ConsumerWidget {
  const _ProgressControls({required this.kr});

  final KeyResult kr;

  Future<void> _enterValue(BuildContext context, WidgetRef ref) async {
    final repo = ref.read(keyResultRepositoryProvider);
    final value = await showDialog<double>(
      context: context,
      builder: (context) =>
          _ValueDialog(initial: kr.currentValue ?? 0, unit: kr.unit),
    );
    if (value != null) await repo.setProgressValue(kr.id, value);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final repo = ref.read(keyResultRepositoryProvider);
    final unit = kr.unit == null ? '' : ' ${kr.unit}';
    final step = formatNumber(kr.step);
    final Widget content = switch (kr.measureType) {
      MeasureType.numeric => Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Row(
              children: [
                IconButton.filledTonal(
                  tooltip: 'Decrease by $step',
                  iconSize: 28,
                  icon: const Icon(Icons.remove),
                  onPressed: () => repo.nudge(kr.id, -kr.step),
                ),
                Expanded(
                  child: Semantics(
                    button: true,
                    label: 'Enter the current value',
                    child: InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: () => _enterValue(context, ref),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Text(
                          '${formatNumber(kr.currentValue ?? 0)}$unit',
                          textAlign: TextAlign.center,
                          style: theme.textTheme.headlineSmall,
                        ),
                      ),
                    ),
                  ),
                ),
                IconButton.filledTonal(
                  tooltip: 'Increase by $step',
                  iconSize: 28,
                  icon: const Icon(Icons.add),
                  onPressed: () => repo.nudge(kr.id, kr.step),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'Step $step$unit · tap the value to enter it',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
      MeasureType.boolean => SwitchListTile(
        title: const Text('Done'),
        value: kr.currentValue == 1,
        onChanged: (done) => repo.setProgressValue(kr.id, done ? 1 : 0),
      ),
      MeasureType.habit => _HabitProgress(kr: kr),
    };
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      clipBehavior: Clip.antiAlias,
      child: content,
    );
  }
}

class _HabitProgress extends ConsumerWidget {
  const _HabitProgress({required this.kr});

  final KeyResult kr;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final habit = (ref.watch(habitsProvider).value ?? const <Habit>[])
        .where((h) => h.id == kr.habitId)
        .firstOrNull;
    final checkIns = ref.watch(habitCheckInsProvider).value?[kr.id] ?? 0;
    return ListTile(
      leading: const Icon(Icons.repeat),
      title: Text(habit?.title ?? 'No habit linked'),
      subtitle: Text(
        '$checkIns / ${formatNumber(kr.targetValue ?? 0)} check-ins · '
        'counted from the habit',
      ),
      onTap: habit == null
          ? null
          : () => showHabitForm(context, habitId: habit.id),
    );
  }
}

class _ValueDialog extends StatefulWidget {
  const _ValueDialog({required this.initial, this.unit});

  final double initial;
  final String? unit;

  @override
  State<_ValueDialog> createState() => _ValueDialogState();
}

class _ValueDialogState extends State<_ValueDialog> {
  late final _value = TextEditingController(text: formatNumber(widget.initial));
  String? _error;

  @override
  void dispose() {
    _value.dispose();
    super.dispose();
  }

  void _save() {
    final value = parseNumber(_value.text);
    if (value == null) {
      setState(() => _error = 'Enter a number');
      return;
    }
    Navigator.of(context).pop(value);
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: const Text('Current value'),
    content: TextField(
      controller: _value,
      autofocus: true,
      decoration: InputDecoration(
        labelText: 'Current value',
        suffixText: widget.unit,
        errorText: _error,
      ),
      keyboardType: const TextInputType.numberWithOptions(
        decimal: true,
        signed: true,
      ),
      onSubmitted: (_) => _save(),
    ),
    actions: [
      TextButton(
        onPressed: () => Navigator.of(context).pop(),
        child: const Text('Cancel'),
      ),
      FilledButton(onPressed: _save, child: const Text('Save')),
    ],
  );
}

class _Projects extends ConsumerWidget {
  const _Projects({required this.kr});

  final KeyResult kr;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projects = [
      for (final p in ref.watch(activeProjectsProvider).value ?? <Project>[])
        if (p.keyResultId == kr.id) p,
    ];
    final areas = {
      for (final a in ref.watch(areasProvider).value ?? const <Area>[]) a.id: a,
    };
    final objective = ref.watch(objectiveProvider(kr.objectiveId)).value;
    final krDeadline = objective == null
        ? null
        : effectiveKrDeadline(kr.deadline, objective.endDate);
    final today = ref.watch(todayProvider);
    final leadDays =
        ref.watch(appSettingsProvider).value?.deadlineLeadDays ?? 7;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionHeading('Projects'),
        if (projects.isEmpty)
          const SectionEmptyText(
            'No active projects',
            icon: Icons.folder_outlined,
          ),
        for (final project in projects)
          ProjectTile(
            project: project,
            area: areas[project.areaId],
            deadline: effectiveProjectDeadline(project.deadline, krDeadline),
            today: today,
            leadDays: leadDays,
            onTap: () => context.push(Routes.projectDetail(project.id)),
          ),
      ],
    );
  }
}

class _Tasks extends ConsumerWidget {
  const _Tasks({required this.kr});

  final KeyResult kr;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasks = [
      for (final t in ref.watch(assignedTasksProvider).value ?? <Task>[])
        if (t.keyResultId == kr.id) t,
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

class _Habits extends ConsumerWidget {
  const _Habits({required this.kr});

  final KeyResult kr;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final habits = [
      for (final h in ref.watch(habitsProvider).value ?? const <Habit>[])
        if (h.keyResultId == kr.id) h,
    ];
    if (habits.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionHeading('Habits'),
        for (final habit in habits)
          ListTile(
            leading: const Icon(Icons.repeat),
            title: Text(habit.title),
            subtitle: Text(
              scheduleSummary(
                habit.scheduleType,
                weekdays: habit.weekdays,
                timesPerWeek: habit.timesPerWeek,
              ),
            ),
            onTap: () => showHabitForm(context, habitId: habit.id),
          ),
      ],
    );
  }
}

class _Log extends ConsumerWidget {
  const _Log({required this.kr});

  final KeyResult kr;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final entries =
        ref.watch(keyResultLogProvider(kr.id)).value ?? const <LogEntry>[];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionHeading('Log'),
        if (entries.isEmpty)
          const SectionEmptyText('Nothing logged yet', icon: Icons.more_time),
        for (final entry in entries) LogEntryTile(entry: entry),
      ],
    );
  }
}
