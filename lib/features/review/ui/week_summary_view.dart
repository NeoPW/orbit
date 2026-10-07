import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/db/app_database.dart';
import '../../../core/router/routes.dart';
import '../../../core/widgets/orbit_ring.dart';
import '../../../core/widgets/section_heading.dart';
import '../../key_results/data/key_result_repository.dart';
import '../../log/domain/duration.dart';
import '../../objectives/data/objective_repository.dart';
import '../../projects/data/project_repository.dart';
import '../../tasks/domain/task_assignment.dart';
import '../../tasks/ui/assignment_picker.dart';
import '../data/review_providers.dart';
import '../domain/week_summary.dart';

String _entries(int count) => count == 1 ? '1 entry' : '$count entries';

/// The week at a glance (week-summary spec): work per project, habit
/// adherence, completed tasks with what they were assigned to, and KR
/// progress since the last review as orbit rings.
class WeekSummaryView extends ConsumerWidget {
  const WeekSummaryView({super.key, required this.weekStart});

  final CalendarDate weekStart;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summary = ref.watch(weekSummaryProvider(weekStart)).value;
    if (summary == null) {
      return const Padding(
        padding: EdgeInsets.all(24),
        child: Center(child: CircularProgressIndicator()),
      );
    }
    final theme = Theme.of(context);
    final muted = TextStyle(color: theme.colorScheme.onSurfaceVariant);
    final projects = {
      for (final p in ref.watch(allProjectsProvider).value ?? const <Project>[])
        p.id: p,
    };
    final keyResults = {
      for (final k
          in ref.watch(keyResultsProvider).value ?? const <KeyResult>[])
        k.id: k,
    };
    final objectives = {
      for (final o
          in ref.watch(objectivesProvider).value ?? const <Objective>[])
        o.id: o,
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionHeading('Work logged'),
        if (summary.work.isEmpty)
          const SectionEmptyText('Nothing logged', icon: Icons.more_time),
        for (final work in summary.work)
          ListTile(
            leading: const Icon(Icons.folder_outlined),
            title: Text(work.title),
            subtitle: Text(
              [
                _entries(work.count),
                if (work.minutes > 0) formatDuration(work.minutes),
              ].join(' · '),
            ),
          ),
        const SectionHeading('Habits'),
        if (summary.habits.isEmpty)
          const SectionEmptyText('No active habits', icon: Icons.repeat),
        for (final item in summary.habits)
          ListTile(
            leading: OrbitRing(
              progress: item.expected == 0 ? 0 : item.done / item.expected,
              size: 32,
              strokeWidth: 3,
            ),
            title: Text(item.habit.title),
            trailing: Text('${item.done} of ${item.expected}', style: muted),
          ),
        const SectionHeading('Tasks completed'),
        if (summary.tasks.isEmpty)
          const SectionEmptyText('No tasks completed', icon: Icons.task_alt),
        for (final (:task, project: _) in summary.tasks)
          _CompletedTaskTile(
            task: task,
            assignment: describeAssignment(
              TaskAssignment.of(task),
              projects: projects,
              keyResults: keyResults,
              objectives: objectives,
            ),
          ),
        const SectionHeading('Key results'),
        if (summary.keyResults.isEmpty)
          const SectionEmptyText('No key results', icon: Icons.track_changes),
        for (final item in summary.keyResults)
          ListTile(
            leading: OrbitRing(
              progress: item.progress,
              size: 44,
              label: '${(item.progress * 100).round()}%',
            ),
            title: Text(item.keyResult.title),
            subtitle: item.change == null
                ? null
                : Text(_change(item), style: muted),
          ),
      ],
    );
  }

  String _change(KrProgressChange item) {
    final change = item.change!;
    final sign = change > 0 ? '+' : '';
    return '$sign$change since last review';
  }
}

/// A completed task with what it was assigned to; opens its task page.
class _CompletedTaskTile extends StatelessWidget {
  const _CompletedTaskTile({required this.task, required this.assignment});

  final Task task;
  final AssignmentInfo? assignment;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final assignment = this.assignment;
    return ListTile(
      leading: Icon(Icons.check_circle, color: theme.colorScheme.secondary),
      title: Text(task.title),
      subtitle: assignment == null
          ? null
          : Row(
              children: [
                Icon(
                  assignment.icon,
                  size: 14,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                const SizedBox(width: 4),
                Flexible(
                  child: Text(
                    assignment.title,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
      onTap: () => context.push(Routes.task(task.id)),
    );
  }
}
