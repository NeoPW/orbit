import 'package:flutter/material.dart';

import '../../../core/db/app_database.dart';

String projectStatusLabel(ProjectStatus status) => switch (status) {
  ProjectStatus.active => 'Active',
  ProjectStatus.backlog => 'Backlog',
  ProjectStatus.paused => 'Paused',
  ProjectStatus.completed => 'Completed',
};

/// The color of a project status chip.
Color projectStatusColor(BuildContext context, ProjectStatus status) {
  final colors = Theme.of(context).colorScheme;
  return switch (status) {
    ProjectStatus.active => colors.primary,
    ProjectStatus.paused => colors.tertiary,
    ProjectStatus.backlog => colors.onSurfaceVariant,
    ProjectStatus.completed => colors.secondary,
  };
}
