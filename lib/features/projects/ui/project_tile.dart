import 'package:flutter/material.dart';

import '../../../core/db/app_database.dart';
import '../../../core/time/date_format.dart';
import '../../../core/widgets/area_dot.dart';
import '../domain/project_deadline.dart';
import 'project_labels.dart';

/// "Due dd-mm-yyyy", marked when inherited from the KR, or "No deadline".
String deadlineLabel(EffectiveDeadline? deadline) {
  if (deadline == null) return 'No deadline';
  final date = 'Due ${formatDate(deadline.date)}';
  return deadline.inherited ? '$date (from key result)' : date;
}

/// A project in a Plan list: title, area, importance and effective deadline.
class ProjectTile extends StatelessWidget {
  const ProjectTile({
    super.key,
    required this.project,
    required this.area,
    required this.deadline,
    this.keyResultTitle,
    this.showStatus = false,
    this.trailing,
    this.onTap,
  });

  final Project project;
  final Area? area;
  final EffectiveDeadline? deadline;

  /// Shown when the project is listed outside its KR.
  final String? keyResultTitle;
  final bool showStatus;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final muted = theme.textTheme.bodySmall?.copyWith(
      color: theme.colorScheme.onSurfaceVariant,
    );
    final area = this.area;
    final keyResultTitle = this.keyResultTitle;

    return ListTile(
      onTap: onTap,
      title: Text(project.title),
      trailing: trailing,
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (keyResultTitle != null)
            Text('Key result: $keyResultTitle', style: muted),
          Wrap(
            spacing: 12,
            runSpacing: 2,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              if (showStatus)
                Text(projectStatusLabel(project.status), style: muted),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (area != null) ...[
                    AreaDot(color: area.color),
                    const SizedBox(width: 4),
                  ],
                  Text(area?.name ?? 'No area', style: muted),
                ],
              ),
              Text('Importance ${project.importance}', style: muted),
              Text(deadlineLabel(deadline), style: muted),
            ],
          ),
        ],
      ),
    );
  }
}
