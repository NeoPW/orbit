import '../../../core/db/app_database.dart';

/// Quick-log order: projects with log entries first, most recently logged
/// first; then the never-logged projects by title (case-insensitive).
List<Project> orderQuickLogProjects(
  List<Project> projects,
  Map<String, DateTime> lastLoggedAt,
) {
  int byTitle(Project a, Project b) =>
      a.title.toLowerCase().compareTo(b.title.toLowerCase());

  return [...projects]..sort((a, b) {
    final aLogged = lastLoggedAt[a.id];
    final bLogged = lastLoggedAt[b.id];
    if (aLogged != null && bLogged != null) {
      final byRecency = bLogged.compareTo(aLogged);
      return byRecency != 0 ? byRecency : byTitle(a, b);
    }
    if (aLogged != null) return -1;
    if (bLogged != null) return 1;
    return byTitle(a, b);
  });
}
