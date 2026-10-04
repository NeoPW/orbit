import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/converters.dart';
import 'package:orbit/core/db/enums.dart';
import 'package:orbit/core/time/calendar_date.dart';

void _roundTrips<T extends Enum>(List<T> values) {
  final converter = DbEnumConverter<T>(values);
  for (final value in values) {
    expect(converter.fromSql(converter.toSql(value)), value);
  }
}

void main() {
  group('DbEnumConverter', () {
    test('round-trips every value of every enum', () {
      _roundTrips(ObjectiveStatus.values);
      _roundTrips(ProjectStatus.values);
      _roundTrips(TaskStatus.values);
      _roundTrips(MeasureType.values);
      _roundTrips(ScheduleType.values);
      _roundTrips(LogSource.values);
    });

    test('stores SPEC text values', () {
      const schedule = DbEnumConverter(ScheduleType.values);
      expect(schedule.toSql(ScheduleType.timesPerWeek), 'times_per_week');
      const status = DbEnumConverter(ProjectStatus.values);
      expect(status.toSql(ProjectStatus.backlog), 'backlog');
    });

    test('rejects unknown values', () {
      const status = DbEnumConverter(ProjectStatus.values);
      expect(() => status.fromSql('timesPerWeek'), throwsArgumentError);
    });
  });

  group('CalendarDateConverter', () {
    const converter = CalendarDateConverter();

    test('stores ISO text and reads it back', () {
      final date = CalendarDate(2026, 12, 31);
      expect(converter.toSql(date), '2026-12-31');
      expect(converter.fromSql('2026-12-31'), date);
    });
  });

  group('WeekdaysConverter', () {
    const converter = WeekdaysConverter();

    test('stores sorted comma-separated weekdays', () {
      expect(converter.toSql({5, 1, 3}), '1,3,5');
      expect(converter.fromSql('1,3,5'), {1, 3, 5});
    });

    test('round-trips the empty set', () {
      expect(converter.toSql(<int>{}), '');
      expect(converter.fromSql(''), isEmpty);
    });

    test('rejects out-of-range weekdays', () {
      expect(() => converter.toSql({0}), throwsArgumentError);
      expect(() => converter.toSql({8}), throwsArgumentError);
    });
  });
}
