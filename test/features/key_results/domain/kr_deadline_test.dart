import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/time/calendar_date.dart';
import 'package:orbit/features/key_results/domain/kr_deadline.dart';

void main() {
  final objectiveEnd = CalendarDate(2026, 12, 31);

  test('uses the KR deadline when set', () {
    expect(
      effectiveKrDeadline(CalendarDate(2026, 11, 15), objectiveEnd),
      CalendarDate(2026, 11, 15),
    );
  });

  test('falls back to the objective end date', () {
    expect(effectiveKrDeadline(null, objectiveEnd), objectiveEnd);
  });
}
