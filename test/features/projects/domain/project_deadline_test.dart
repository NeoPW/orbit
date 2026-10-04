import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/time/calendar_date.dart';
import 'package:orbit/features/key_results/domain/kr_deadline.dart';
import 'package:orbit/features/projects/domain/project_deadline.dart';

void main() {
  final objectiveEnd = CalendarDate(2026, 12, 31);

  test('own deadline wins over the KR deadline', () {
    final kr = effectiveKrDeadline(null, objectiveEnd);
    expect(
      effectiveProjectDeadline(CalendarDate(2026, 10, 20), kr),
      EffectiveDeadline(CalendarDate(2026, 10, 20), inherited: false),
    );
  });

  test('inherits the KR deadline', () {
    final kr = effectiveKrDeadline(CalendarDate(2026, 11, 15), objectiveEnd);
    expect(
      effectiveProjectDeadline(null, kr),
      EffectiveDeadline(CalendarDate(2026, 11, 15), inherited: true),
    );
  });

  test('inherits the objective end date when the KR has no deadline', () {
    final kr = effectiveKrDeadline(null, objectiveEnd);
    expect(
      effectiveProjectDeadline(null, kr),
      EffectiveDeadline(objectiveEnd, inherited: true),
    );
  });

  test('no deadline anywhere', () {
    expect(effectiveProjectDeadline(null, null), isNull);
  });
}
