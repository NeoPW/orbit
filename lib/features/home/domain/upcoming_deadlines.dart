import '../../../core/db/app_database.dart';

enum DeadlineKind { task, project }

/// A task or project whose own deadline is overdue or coming up.
class UpcomingDeadline {
  const UpcomingDeadline({
    required this.kind,
    required this.id,
    required this.title,
    required this.date,
    required this.overdue,
    this.projectId,
    this.projectTitle,
  });

  final DeadlineKind kind;

  /// The task or project ID.
  final String id;
  final String title;
  final CalendarDate date;
  final bool overdue;

  /// The task's project, or the project itself; null for tasks outside
  /// projects.
  final String? projectId;

  /// For tasks: the title of their project.
  final String? projectTitle;
}

/// Every task and project with an own deadline that Home and the reminders
/// care about: open tasks of active projects, open tasks outside projects
/// ([tasksOutsideProjects]) and active projects. Inherited deadlines are not
/// included. No date filter; sorted by date, then title.
List<UpcomingDeadline> deadlineCandidates({
  required List<({Task task, Project project})> tasks,
  List<Task> tasksOutsideProjects = const [],
  required List<Project> projects,
  required CalendarDate today,
}) {
  final items = [
    for (final (:task, :project) in tasks)
      if (task.dueDate case final due?
          when task.status == TaskStatus.open &&
              project.status == ProjectStatus.active)
        UpcomingDeadline(
          kind: DeadlineKind.task,
          id: task.id,
          title: task.title,
          date: due,
          overdue: due.isBefore(today),
          projectId: project.id,
          projectTitle: project.title,
        ),
    for (final task in tasksOutsideProjects)
      if (task.dueDate case final due?
          when task.status == TaskStatus.open && task.projectId == null)
        UpcomingDeadline(
          kind: DeadlineKind.task,
          id: task.id,
          title: task.title,
          date: due,
          overdue: due.isBefore(today),
        ),
    for (final project in projects)
      if (project.deadline case final deadline?
          when project.status == ProjectStatus.active)
        UpcomingDeadline(
          kind: DeadlineKind.project,
          id: project.id,
          title: project.title,
          date: deadline,
          overdue: deadline.isBefore(today),
          projectId: project.id,
        ),
  ];
  return items..sort((a, b) {
    final byDate = a.date.compareTo(b.date);
    return byDate != 0
        ? byDate
        : a.title.toLowerCase().compareTo(b.title.toLowerCase());
  });
}

/// Home's "Upcoming deadlines": the [deadlineCandidates] whose deadline is
/// at most [leadDays] after [today] (overdue included). Items with their own
/// card on Home are listed too, so nothing overdue is missed.
List<UpcomingDeadline> buildUpcomingDeadlines({
  required List<({Task task, Project project})> tasks,
  List<Task> tasksOutsideProjects = const [],
  required List<Project> projects,
  required CalendarDate today,
  required int leadDays,
}) {
  final last = today.addDays(leadDays);
  return [
    for (final item in deadlineCandidates(
      tasks: tasks,
      tasksOutsideProjects: tasksOutsideProjects,
      projects: projects,
      today: today,
    ))
      if (!item.date.isAfter(last)) item,
  ];
}
