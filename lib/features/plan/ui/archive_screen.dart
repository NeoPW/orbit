import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/db/app_database.dart';
import '../../../core/router/routes.dart';
import '../../../core/time/date_format.dart';
import '../../../core/widgets/async_body.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/max_width_body.dart';
import '../../../core/widgets/orbit_chips.dart';
import '../../projects/ui/project_labels.dart';
import '../data/plan_providers.dart';

/// Completed/archived objectives and completed projects. Tapping one opens
/// its page, where the status can be changed back.
class ArchiveScreen extends ConsumerWidget {
  const ArchiveScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Archive')),
      body: AsyncBody(
        value: ref.watch(archiveProvider),
        data: (items) => items.isEmpty
            ? const EmptyState(
                icon: Icons.archive_outlined,
                message: 'Nothing archived yet',
              )
            : MaxWidthBody(
                child: ListView(
                  children: [
                    for (final item in items)
                      switch (item) {
                        ArchivedObjective(:final objective) => ListTile(
                          leading: const Icon(Icons.flag_outlined),
                          title: Text(objective.title),
                          subtitle: Text(
                            formatDateRange(
                              objective.startDate,
                              objective.endDate,
                            ),
                          ),
                          trailing:
                              objective.status == ObjectiveStatus.completed
                              ? StatusChip<void>(
                                  label: 'Completed',
                                  color: colors.secondary,
                                )
                              : StatusChip<void>(
                                  label: 'Archived',
                                  color: colors.onSurfaceVariant,
                                ),
                          onTap: () =>
                              context.push(Routes.objective(objective.id)),
                        ),
                        ArchivedProject(:final project) => ListTile(
                          leading: const Icon(Icons.folder_outlined),
                          title: Text(project.title),
                          trailing: StatusChip<void>(
                            label: projectStatusLabel(project.status),
                            color: projectStatusColor(context, project.status),
                          ),
                          onTap: () =>
                              context.push(Routes.projectDetail(project.id)),
                        ),
                      },
                  ],
                ),
              ),
      ),
    );
  }
}
