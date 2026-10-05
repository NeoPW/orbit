import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/features/log/domain/duration.dart';

void main() {
  group('validateDuration', () {
    test('empty means no duration', () {
      expect(validateDuration(''), isNull);
      expect(validateDuration('  '), isNull);
    });

    test('accepts 1 to 1440 minutes', () {
      expect(validateDuration('1'), isNull);
      expect(validateDuration(' 45 '), isNull);
      expect(validateDuration('1440'), isNull);
    });

    test('rejects values out of range', () {
      expect(validateDuration('0'), DurationError.outOfRange);
      expect(validateDuration('1441'), DurationError.outOfRange);
      expect(validateDuration('-5'), DurationError.outOfRange);
    });

    test('rejects anything but a whole number', () {
      expect(validateDuration('abc'), DurationError.notAWholeNumber);
      expect(validateDuration('4.5'), DurationError.notAWholeNumber);
    });
  });

  test('parseDuration returns null for empty input', () {
    expect(parseDuration(''), isNull);
    expect(parseDuration(' 30 '), 30);
  });

  group('formatDuration', () {
    test('minutes only', () => expect(formatDuration(45), '45 min'));
    test('whole hours', () {
      expect(formatDuration(60), '1 h');
      expect(formatDuration(120), '2 h');
    });
    test('hours and minutes', () => expect(formatDuration(90), '1 h 30 min'));
  });
}
