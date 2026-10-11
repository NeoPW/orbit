import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/db/app_database.dart';
import '../../../core/router/routes.dart';
import '../../../core/space/space_colors.dart';
import '../../../core/widgets/orbit_ring.dart';
import '../../../core/widgets/section_heading.dart';
import '../../goals/domain/goal_work.dart';
import '../../log/domain/duration.dart';
import '../../tasks/ui/assignment_picker.dart';
import '../data/review_providers.dart';
import '../domain/week_summary.dart';

String _entries(int count) => count == 1 ? '1 entry' : '$count entries';

String _work(int count, int minutes) =>
    [_entries(count), if (minutes > 0) formatDuration(minutes)].join(' · ');

String _signed(int change) => '${change > 0 ? '+' : ''}$change';

/// The week at a glance (week-summary spec): the goals with their progress
/// since the last review and the work on them, the work per project grouped
/// by goal, the projects and tasks finished, and habit adherence.
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
    final finished =
        summary.finishedProjects.isNotEmpty || summary.tasks.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionHeading('Goals'),
        if (summary.goals.isEmpty)
          const SectionEmptyText('No active goals', icon: Icons.flag_outlined),
        for (final item in summary.goals) _GoalChange(item: item),
        const SectionHeading('Work logged'),
        if (summary.work.isEmpty)
          const SectionEmptyText('Nothing logged', icon: Icons.more_time),
        for (final group in summary.workGroups) ...[
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Text(
              group.goal?.title ?? 'Without a goal',
              style: theme.textTheme.labelLarge?.copyWith(
                color: group.goal == null
                    ? theme.colorScheme.onSurfaceVariant
                    : colorOfGoal(group.goal!),
              ),
            ),
          ),
          for (final work in group.projects)
            ListTile(
              leading: const Icon(Icons.folder_outlined),
              title: Text(work.title),
              subtitle: Text(_work(work.count, work.minutes)),
              onTap: work.projectId == null
                  ? null
                  : () => context.push(Routes.projectDetail(work.projectId!)),
            ),
        ],
        const SectionHeading('Finished'),
        if (!finished)
          const SectionEmptyText(
            'No projects or tasks finished',
            icon: Icons.task_alt,
          ),
        for (final (:project, :goal) in summary.finishedProjects)
          ListTile(
            leading: Icon(Icons.verified, color: theme.colorScheme.secondary),
            title: Text(project.title),
            subtitle: goal == null ? null : Text(goal.title, style: muted),
            onTap: () => context.push(Routes.projectDetail(project.id)),
          ),
        for (final (:task, :project, :goal) in summary.tasks)
          _CompletedTaskTile(
            task: task,
            assignment: switch ((project, goal)) {
              (final p?, _) => (
                kind: 'Project',
                title: p.title,
                icon: Icons.folder_outlined,
              ),
              (_, final g?) => (
                kind: 'Goal',
                title: g.title,
                icon: Icons.flag_outlined,
              ),
              _ => null,
            },
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
      ],
    );
  }
}

/// A goal in the summary: its progress with the change, the work on it,
/// and its measures with their changes.
class _GoalChange extends StatelessWidget {
  const _GoalChange({required this.item});

  final GoalProgressChange item;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final muted = theme.textTheme.bodySmall?.copyWith(
      color: theme.colorScheme.onSurfaceVariant,
    );
    final color = colorOfGoal(item.goal);
    final progress = item.progress;
    final change = item.change;
    final WorkTotal work = item.work;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ListTile(
          leading: OrbitRing(
            progress: progress ?? 0,
            size: 44,
            color: color,
            label: progress == null ? '–' : '${(progress * 100).round()}%',
          ),
          title: Text(item.goal.title),
          subtitle: Text(
            [
              if (change != null) '${_signed(change)} since last review',
              if (work.entries > 0) _work(work.entries, work.minutes),
            ].join(' · '),
            style: muted,
          ),
          onTap: () => context.push(Routes.goal(item.goal.id)),
        ),
        for (final m in item.measures)
          Padding(
            padding: const EdgeInsets.fromLTRB(72, 0, 16, 6),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    m.measure.title,
                    style: theme.textTheme.bodySmall,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Text(
                  [
                    '${(m.progress * 100).round()}%',
                    if (m.change != null) _signed(m.change!),
                  ].join('  '),
                  style: muted,
                ),
              ],
            ),
          ),
      ],
    );
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
