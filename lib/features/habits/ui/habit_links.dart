import '../../../core/db/app_database.dart';

/// "Project: X · Key result: Y", or "No link".
String habitLinkLabel(
  Habit habit, {
  required Map<String, Project> projects,
  required Map<String, KeyResult> keyResults,
}) {
  final project = projects[habit.projectId];
  final kr = keyResults[habit.keyResultId];
  final parts = [
    if (project != null) 'Project: ${project.title}',
    if (kr != null) 'Key result: ${kr.title}',
  ];
  return parts.isEmpty ? 'No link' : parts.join(' · ');
}
