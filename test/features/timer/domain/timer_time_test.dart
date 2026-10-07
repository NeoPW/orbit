import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/features/timer/domain/timer_time.dart';

void main() {
  group('formatElapsed', () {
    test('below an hour as m:ss', () {
      expect(formatElapsed(const Duration(seconds: 7)), '0:07');
      expect(formatElapsed(const Duration(minutes: 45, seconds: 3)), '45:03');
    });

    test('from an hour as h:mm:ss', () {
      expect(
        formatElapsed(const Duration(hours: 1, minutes: 5, seconds: 3)),
        '1:05:03',
      );
      expect(formatElapsed(const Duration(hours: 12)), '12:00:00');
    });
  });

  group('loggedMinutes', () {
    test('whole minutes', () {
      expect(loggedMinutes(const Duration(minutes: 45)), 45);
      expect(loggedMinutes(const Duration(minutes: 45, seconds: 59)), 45);
    });

    test('at least 1', () {
      expect(loggedMinutes(const Duration(seconds: 20)), 1);
      expect(loggedMinutes(Duration.zero), 1);
    });
  });

  test('elapsed is never negative', () {
    final start = DateTime.utc(2026, 10, 7, 9);
    expect(
      timerElapsed(start, start.add(const Duration(minutes: 40))),
      const Duration(minutes: 40),
    );
    expect(
      timerElapsed(start, start.subtract(const Duration(minutes: 1))),
      Duration.zero,
    );
  });
}
