import 'package:flutter/material.dart';

import '../../../core/db/app_database.dart';
import '../../../core/widgets/area_dot.dart';
import '../../../core/widgets/orbit_chips.dart';
import '../domain/project_deadline.dart';
import 'project_labels.dart';

/// A project in a Plan list: title, then chips for status, area, deadline
/// and importance. Values that are not set are left out.
class ProjectTile extends StatelessWidget {
  const ProjectTile({
    super.key,
    required this.project,
    required this.area,
    required this.deadline,
    required this.today,
    this.leadDays = 7,
    this.keyResultTitle,
    this.showStatus = false,
    this.trailing,
    this.onTap,
  });

  final Project project;
  final Area? area;
  final EffectiveDeadline? deadline;
  final CalendarDate today;
  final int leadDays;

  /// Shown when the project is listed outside its KR.
  final String? keyResultTitle;
  final bool showStatus;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final area = this.area;
    final deadline = this.deadline;
    final keyResultTitle = this.keyResultTitle;

    return ListTile(
      onTap: onTap,
      leading: area == null
          ? const Icon(Icons.folder_outlined)
          : AreaDot(color: area.color, size: 12),
      title: Text(project.title),
      trailing: trailing,
      subtitle: Padding(
        padding: const EdgeInsets.only(top: 6),
        child: Wrap(
          spacing: 6,
          runSpacing: 6,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            if (showStatus)
              StatusChip<void>(
                label: projectStatusLabel(project.status),
                color: projectStatusColor(context, project.status),
              ),
            if (area != null) AreaChip(area: area),
            if (deadline != null)
              DeadlineChip(
                date: deadline.date,
                today: today,
                leadDays: leadDays,
                inherited: deadline.inherited,
              ),
            ImportanceDots(value: project.importance),
            if (keyResultTitle != null)
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.track_changes,
                    size: 14,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    keyResultTitle,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}
