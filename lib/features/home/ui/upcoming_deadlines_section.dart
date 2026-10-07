import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/routes.dart';
import '../../../core/time/today.dart';
import '../../../core/widgets/animated_items.dart';
import '../../../core/widgets/orbit_chips.dart';
import '../../../core/widgets/section_heading.dart';
import '../../settings/data/settings_repository.dart';
import '../data/home_providers.dart';
import '../domain/upcoming_deadlines.dart';

/// "Upcoming deadlines": KRs and tasks inside projects due within the lead
/// time; items with their own card show their badge there instead.
class UpcomingDeadlinesSection extends ConsumerWidget {
  const UpcomingDeadlinesSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(upcomingDeadlinesProvider).value;
    final leadDays = ref.watch(appSettingsProvider).value?.deadlineLeadDays;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionHeading('Upcoming deadlines'),
        if (items != null && items.isEmpty)
          SectionEmptyText(
            'Nothing due in the next $leadDays days',
            icon: Icons.event_available_outlined,
          ),
        AnimatedItems(
          children: [
            for (final item in items ?? const <UpcomingDeadline>[])
              _DeadlineTile(
                key: ValueKey('${item.kind}-${item.id}'),
                item: item,
                leadDays: leadDays ?? 7,
              ),
          ],
        ),
      ],
    );
  }
}

class _DeadlineTile extends ConsumerWidget {
  const _DeadlineTile({super.key, required this.item, required this.leadDays});

  final UpcomingDeadline item;
  final int leadDays;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final (icon, kind) = switch (item.kind) {
      DeadlineKind.task => (Icons.task_alt, 'Task'),
      DeadlineKind.project => (Icons.folder_outlined, 'Project'),
      DeadlineKind.keyResult => (Icons.track_changes, 'Key result'),
    };
    final projectTitle = item.projectTitle;
    return ListTile(
      leading: Icon(icon),
      title: Text(item.title),
      subtitle: Text([kind, ?projectTitle].join(' · ')),
      trailing: DeadlineChip(
        date: item.date,
        today: ref.watch(todayProvider),
        leadDays: leadDays,
      ),
      onTap: () => context.push(switch (item.kind) {
        DeadlineKind.keyResult => Routes.keyResult(item.id),
        DeadlineKind.task => Routes.task(item.id),
        DeadlineKind.project => Routes.projectDetail(item.id),
      }),
    );
  }
}
