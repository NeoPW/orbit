import '../../../core/db/app_database.dart';
import '../../key_results/domain/kr_progress.dart';

/// How many days ahead Home lists deadlines. Fixed until there is a
/// Settings screen.
const deadlineLeadDays = 7;

enum DeadlineKind { task, project, keyResult }

/// A task, project or KR whose own deadline is overdue or coming up.
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

  /// The task, project or KR ID.
  final String id;
  final String title;
  final CalendarDate date;
  final bool overdue;

  /// The project to open: the task's project, or the project itself.
  final String? projectId;

  /// For tasks: the title of their project.
  final String? projectTitle;
}

/// The upcoming deadlines for Home (home spec, "Upcoming deadlines"):
/// open tasks of active projects, active projects and not yet reached KRs
/// of active objectives, each by its *own* deadline, when it is at most
/// [deadlineLeadDays] after [today] (overdue included). Sorted by date,
/// then title.
List<UpcomingDeadline> buildUpcomingDeadlines({
  required List<({Task task, Project project})> tasks,
  required List<Project> projects,
  required List<KeyResult> keyResults,
  required List<Objective> objectives,
  required Map<String, int> habitCheckIns,
  required CalendarDate today,
}) {
  final last = today.addDays(deadlineLeadDays);
  bool upcoming(CalendarDate date) => !date.isAfter(last);
  final activeObjectiveIds = {
    for (final o in objectives)
      if (o.status == ObjectiveStatus.active) o.id,
  };

  final items = [
    for (final (:task, :project) in tasks)
      if (task.dueDate case final due?
          when task.status == TaskStatus.open &&
              project.status == ProjectStatus.active &&
              upcoming(due))
        UpcomingDeadline(
          kind: DeadlineKind.task,
          id: task.id,
          title: task.title,
          date: due,
          overdue: due.isBefore(today),
          projectId: project.id,
          projectTitle: project.title,
        ),
    for (final project in projects)
      if (project.deadline case final deadline?
          when project.status == ProjectStatus.active && upcoming(deadline))
        UpcomingDeadline(
          kind: DeadlineKind.project,
          id: project.id,
          title: project.title,
          date: deadline,
          overdue: deadline.isBefore(today),
          projectId: project.id,
        ),
    for (final kr in keyResults)
      if (kr.deadline case final deadline?
          when activeObjectiveIds.contains(kr.objectiveId) &&
              upcoming(deadline) &&
              krProgress(
                    kr.measureType,
                    start: kr.startValue,
                    target: kr.targetValue,
                    current: kr.currentValue,
                    habitCheckIns: habitCheckIns[kr.id] ?? 0,
                  ) <
                  1)
        UpcomingDeadline(
          kind: DeadlineKind.keyResult,
          id: kr.id,
          title: kr.title,
          date: deadline,
          overdue: deadline.isBefore(today),
        ),
  ];
  return items..sort((a, b) {
    final byDate = a.date.compareTo(b.date);
    return byDate != 0
        ? byDate
        : a.title.toLowerCase().compareTo(b.title.toLowerCase());
  });
}
