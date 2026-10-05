import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/db/app_database.dart';
import '../../../core/widgets/section_heading.dart';
import '../../log/domain/duration.dart';
import '../data/review_providers.dart';
import '../domain/week_summary.dart';

String _entries(int count) => count == 1 ? '1 entry' : '$count entries';

/// The week at a glance (week-summary spec): work per project, habit
/// adherence, completed tasks and KR progress since the last review.
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
    final muted = TextStyle(
      color: Theme.of(context).colorScheme.onSurfaceVariant,
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionHeading('Work logged'),
        if (summary.work.isEmpty) const SectionEmptyText('Nothing logged'),
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
        if (summary.habits.isEmpty) const SectionEmptyText('No active habits'),
        for (final item in summary.habits)
          ListTile(
            leading: const Icon(Icons.repeat),
            title: Text(item.habit.title),
            trailing: Text('${item.done} of ${item.expected}'),
          ),
        const SectionHeading('Tasks completed'),
        if (summary.tasks.isEmpty) const SectionEmptyText('No tasks completed'),
        for (final (:task, :project) in summary.tasks)
          ListTile(
            leading: const Icon(Icons.task_alt),
            title: Text(task.title),
            subtitle: project == null ? null : Text(project.title),
          ),
        const SectionHeading('Key results'),
        if (summary.keyResults.isEmpty)
          const SectionEmptyText('No key results'),
        for (final item in summary.keyResults)
          ListTile(
            leading: const Icon(Icons.track_changes),
            title: Text(item.keyResult.title),
            subtitle: item.change == null
                ? null
                : Text(_change(item), style: muted),
            trailing: Text('${(item.progress * 100).round()} %'),
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
