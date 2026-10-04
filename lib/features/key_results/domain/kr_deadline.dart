import '../../../core/time/calendar_date.dart';

/// A KR's effective deadline: its own deadline, else its objective's end
/// date (docs/SPEC.md §5).
CalendarDate effectiveKrDeadline(
  CalendarDate? krDeadline,
  CalendarDate objectiveEnd,
) => krDeadline ?? objectiveEnd;
