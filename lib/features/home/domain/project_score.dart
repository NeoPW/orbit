import '../../../core/db/app_database.dart';
import '../../projects/domain/project_deadline.dart';

/// Urgency of a project from its effective deadline, in local calendar days
/// from [today] (home spec, "Project urgency"): overdue 5, up to 3 days 4,
/// up to 7 days 3, up to 30 days 2, later or no deadline 1. Task due dates
/// do not count.
int urgency(CalendarDate? effectiveDeadline, CalendarDate today) {
  if (effectiveDeadline == null) return 1;
  final days = today.daysUntil(effectiveDeadline);
  if (days < 0) return 5;
  if (days <= 3) return 4;
  if (days <= 7) return 3;
  if (days <= 30) return 2;
  return 1;
}

/// A project with its effective deadline and Home score.
class ScoredProject {
  ScoredProject(this.project, this.deadline, {required CalendarDate today})
    : score = project.importance * urgency(deadline?.date, today);

  final Project project;
  final EffectiveDeadline? deadline;

  /// Importance × urgency; used for ordering only, never shown.
  final int score;
}

/// Home ordering: score (highest first), then effective deadline (earliest
/// first, none last), then title (case-insensitive).
int compareProjectsForHome(ScoredProject a, ScoredProject b) {
  final byScore = b.score.compareTo(a.score);
  if (byScore != 0) return byScore;

  final aDate = a.deadline?.date;
  final bDate = b.deadline?.date;
  if (aDate != null && bDate != null) {
    final byDate = aDate.compareTo(bDate);
    if (byDate != 0) return byDate;
  } else if (aDate != null) {
    return -1;
  } else if (bDate != null) {
    return 1;
  }

  return a.project.title.toLowerCase().compareTo(b.project.title.toLowerCase());
}
