import 'package:flutter/material.dart';

import '../../../core/db/app_database.dart';

/// What a habit is linked to: its project and KR, if they still exist.
List<({IconData icon, String title})> habitLinks(
  Habit habit, {
  required Map<String, Project> projects,
  required Map<String, KeyResult> keyResults,
}) {
  final project = projects[habit.projectId];
  final kr = keyResults[habit.keyResultId];
  return [
    if (project != null) (icon: Icons.folder_outlined, title: project.title),
    if (kr != null) (icon: Icons.track_changes, title: kr.title),
  ];
}
