import '../../../core/time/calendar_date.dart';

/// A project's effective deadline and whether it comes from its goal.
class EffectiveDeadline {
  const EffectiveDeadline(this.date, {required this.inherited});

  final CalendarDate date;

  /// True when the project has no own deadline and uses its goal's end
  /// date.
  final bool inherited;

  @override
  bool operator ==(Object other) =>
      other is EffectiveDeadline &&
      other.date == date &&
      other.inherited == inherited;

  @override
  int get hashCode => Object.hash(date, inherited);

  @override
  String toString() => 'EffectiveDeadline($date, inherited: $inherited)';
}

/// A project's effective deadline: its own deadline, else the end date of
/// the goal it serves, else none (docs/SPEC.md §5).
EffectiveDeadline? effectiveProjectDeadline(
  CalendarDate? projectDeadline,
  CalendarDate? goalEndDate,
) {
  if (projectDeadline != null) {
    return EffectiveDeadline(projectDeadline, inherited: false);
  }
  if (goalEndDate != null) {
    return EffectiveDeadline(goalEndDate, inherited: true);
  }
  return null;
}
