import '../../../core/db/app_database.dart';

/// [items] with log entries first, most recently logged first, then the
/// rest by title (case-insensitive).
List<T> _recentFirst<T>(
  List<T> items,
  Map<String, DateTime> lastLoggedAt, {
  required String Function(T) id,
  required String Function(T) title,
}) {
  int byTitle(T a, T b) =>
      title(a).toLowerCase().compareTo(title(b).toLowerCase());
  return [...items]..sort((a, b) {
    final aLogged = lastLoggedAt[id(a)];
    final bLogged = lastLoggedAt[id(b)];
    if (aLogged != null && bLogged != null) {
      final byRecency = bLogged.compareTo(aLogged);
      return byRecency != 0 ? byRecency : byTitle(a, b);
    }
    if (aLogged != null) return -1;
    if (bLogged != null) return 1;
    return byTitle(a, b);
  });
}

/// Quick-log order of projects: recently logged first, then by title.
List<Project> orderQuickLogProjects(
  List<Project> projects,
  Map<String, DateTime> lastLoggedAt,
) => _recentFirst(
  projects,
  lastLoggedAt,
  id: (p) => p.id,
  title: (p) => p.title,
);

/// Quick-log targets (work-log spec): active projects, then open tasks
/// outside projects, each recently logged first, then by title.
({List<Project> projects, List<Task> tasks}) orderQuickLogTargets({
  required List<Project> projects,
  required List<Task> tasks,
  required Map<String, DateTime> lastLoggedProjects,
  required Map<String, DateTime> lastLoggedTasks,
}) => (
  projects: orderQuickLogProjects(projects, lastLoggedProjects),
  tasks: _recentFirst(
    tasks,
    lastLoggedTasks,
    id: (t) => t.id,
    title: (t) => t.title,
  ),
);
