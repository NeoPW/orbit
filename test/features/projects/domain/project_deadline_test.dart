import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/time/calendar_date.dart';
import 'package:orbit/features/projects/domain/project_deadline.dart';

void main() {
  final goalEnd = CalendarDate(2026, 12, 31);

  test('own deadline wins over the goal end date', () {
    expect(
      effectiveProjectDeadline(CalendarDate(2026, 10, 20), goalEnd),
      EffectiveDeadline(CalendarDate(2026, 10, 20), inherited: false),
    );
  });

  test('inherits the goal end date', () {
    expect(
      effectiveProjectDeadline(null, goalEnd),
      EffectiveDeadline(goalEnd, inherited: true),
    );
  });

  test('no deadline anywhere', () {
    expect(effectiveProjectDeadline(null, null), isNull);
  });
}
