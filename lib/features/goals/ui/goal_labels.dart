import 'package:flutter/material.dart';

import '../../../core/db/app_database.dart';

String goalStatusLabel(GoalStatus status) => switch (status) {
  GoalStatus.active => 'Active',
  GoalStatus.completed => 'Completed',
  GoalStatus.archived => 'Archived',
};

/// The color of a goal status chip.
Color goalStatusColor(BuildContext context, GoalStatus status) {
  final colors = Theme.of(context).colorScheme;
  return switch (status) {
    GoalStatus.active => colors.primary,
    GoalStatus.completed => colors.secondary,
    GoalStatus.archived => colors.onSurfaceVariant,
  };
}
