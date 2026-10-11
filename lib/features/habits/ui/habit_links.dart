import 'package:flutter/material.dart';

import '../../../core/db/app_database.dart';

/// What a habit is linked to: its project and goal, if they still exist.
List<({IconData icon, String title})> habitLinks(
  Habit habit, {
  required Map<String, Project> projects,
  required Map<String, Goal> goals,
}) {
  final project = projects[habit.projectId];
  final goal = goals[habit.goalId];
  return [
    if (project != null) (icon: Icons.folder_outlined, title: project.title),
    if (goal != null) (icon: Icons.flag_outlined, title: goal.title),
  ];
}
