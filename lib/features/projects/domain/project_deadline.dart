import '../../../core/time/calendar_date.dart';

/// A project's effective deadline and whether it comes from its KR.
class EffectiveDeadline {
  const EffectiveDeadline(this.date, {required this.inherited});

  final CalendarDate date;

  /// True when the project has no own deadline and uses its KR's.
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

/// A project's effective deadline: its own deadline, else the effective
/// deadline of its KR, else none (docs/SPEC.md §5).
EffectiveDeadline? effectiveProjectDeadline(
  CalendarDate? projectDeadline,
  CalendarDate? krEffectiveDeadline,
) {
  if (projectDeadline != null) {
    return EffectiveDeadline(projectDeadline, inherited: false);
  }
  if (krEffectiveDeadline != null) {
    return EffectiveDeadline(krEffectiveDeadline, inherited: true);
  }
  return null;
}
