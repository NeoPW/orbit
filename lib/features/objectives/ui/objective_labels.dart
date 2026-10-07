import 'package:flutter/material.dart';

import '../../../core/db/app_database.dart';

String objectiveStatusLabel(ObjectiveStatus status) => switch (status) {
  ObjectiveStatus.active => 'Active',
  ObjectiveStatus.completed => 'Completed',
  ObjectiveStatus.archived => 'Archived',
};

/// The color of an objective status chip.
Color objectiveStatusColor(BuildContext context, ObjectiveStatus status) {
  final colors = Theme.of(context).colorScheme;
  return switch (status) {
    ObjectiveStatus.active => colors.primary,
    ObjectiveStatus.completed => colors.secondary,
    ObjectiveStatus.archived => colors.onSurfaceVariant,
  };
}
