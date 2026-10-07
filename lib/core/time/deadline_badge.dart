import 'calendar_date.dart';

/// The deadline badge of a project card (home spec, "Project card").
sealed class DeadlineBadge {
  const DeadlineBadge();
}

class Overdue extends DeadlineBadge {
  const Overdue();
}

class DueToday extends DeadlineBadge {
  const DueToday();
}

class DueTomorrow extends DeadlineBadge {
  const DueTomorrow();
}

/// Due in 2 to 30 days.
class DueInDays extends DeadlineBadge {
  const DueInDays(this.days);

  final int days;
}

/// Due more than 30 days from today.
class DueOn extends DeadlineBadge {
  const DueOn(this.date);

  final CalendarDate date;
}

/// The badge for an effective deadline [date] seen from [today].
DeadlineBadge deadlineBadge(CalendarDate date, CalendarDate today) {
  final days = today.daysUntil(date);
  if (days < 0) return const Overdue();
  if (days == 0) return const DueToday();
  if (days == 1) return const DueTomorrow();
  if (days <= 30) return DueInDays(days);
  return DueOn(date);
}
