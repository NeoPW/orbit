import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/routes.dart';
import '../../../core/time/date_format.dart';
import '../../../core/widgets/section_heading.dart';
import '../data/home_providers.dart';
import '../domain/upcoming_deadlines.dart';

/// "Upcoming deadlines": tasks, projects and KRs due within the lead time.
class UpcomingDeadlinesSection extends ConsumerWidget {
  const UpcomingDeadlinesSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(upcomingDeadlinesProvider).value;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionHeading('Upcoming deadlines'),
        if (items != null && items.isEmpty)
          const SectionEmptyText('Nothing due in the next 7 days'),
        for (final item in items ?? const <UpcomingDeadline>[])
          _DeadlineTile(item: item),
      ],
    );
  }
}

class _DeadlineTile extends StatelessWidget {
  const _DeadlineTile({required this.item});

  final UpcomingDeadline item;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final (icon, kind) = switch (item.kind) {
      DeadlineKind.task => (Icons.task_alt, 'Task'),
      DeadlineKind.project => (Icons.folder_outlined, 'Project'),
      DeadlineKind.keyResult => (Icons.track_changes, 'Key result'),
    };
    final projectTitle = item.projectTitle;
    return ListTile(
      leading: Icon(icon),
      title: Text(item.title),
      subtitle: Text(
        [kind, ?projectTitle, 'Due ${formatDate(item.date)}'].join(' · '),
      ),
      trailing: item.overdue
          ? Text(
              'Overdue',
              style: theme.textTheme.labelLarge?.copyWith(
                color: theme.colorScheme.error,
              ),
            )
          : null,
      onTap: () => context.push(
        item.kind == DeadlineKind.keyResult
            ? Routes.keyResult(item.id)
            : Routes.projectDetail(item.projectId!),
      ),
    );
  }
}
