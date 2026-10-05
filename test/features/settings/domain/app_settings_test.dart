import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/features/settings/domain/app_settings.dart';

void main() {
  group('time of day', () {
    test('round-trips HH:mm', () {
      expect(parseTimeOfDay('07:05'), (hour: 7, minute: 5));
      expect(formatTimeOfDay((hour: 7, minute: 5)), '07:05');
      expect(formatTimeOfDay(parseTimeOfDay('23:59')!), '23:59');
    });

    test('rejects other text', () {
      for (final text in ['7:05', '24:00', '12:60', 'x', '']) {
        expect(parseTimeOfDay(text), isNull, reason: text);
      }
    });
  });

  group('validateLeadDays', () {
    test('accepts 1 to 30', () {
      expect(validateLeadDays('1'), isNull);
      expect(validateLeadDays(' 30 '), isNull);
    });

    test('rejects values out of range', () {
      expect(validateLeadDays('0'), LeadDaysError.outOfRange);
      expect(validateLeadDays('31'), LeadDaysError.outOfRange);
    });

    test('rejects anything but a whole number', () {
      expect(validateLeadDays('x'), LeadDaysError.notAWholeNumber);
      expect(validateLeadDays(''), LeadDaysError.notAWholeNumber);
    });
  });

  group('AppSettings', () {
    test('defaults: reminders on, 08:00, 7 days', () {
      const settings = AppSettings();
      expect(settings.remindersEnabled, isTrue);
      expect(settings.defaultReminderTime, (hour: 8, minute: 0));
      expect(settings.deadlineLeadDays, 7);
      expect(settings.reviewDay, DateTime.sunday);
      expect(settings.reviewTime, (hour: 18, minute: 0));
      expect(AppSettings.fromStored({}), settings);
    });

    test('reads stored values', () {
      final settings = AppSettings.fromStored({
        SettingKeys.remindersEnabled: 'false',
        SettingKeys.defaultReminderTime: '07:15',
        SettingKeys.deadlineLeadDays: '3',
        SettingKeys.reviewDay: '6',
        SettingKeys.reviewTime: '10:00',
      });
      expect(settings.reviewDay, DateTime.saturday);
      expect(settings.reviewTime, (hour: 10, minute: 0));
      expect(settings.remindersEnabled, isFalse);
      expect(settings.defaultReminderTime, (hour: 7, minute: 15));
      expect(settings.deadlineLeadDays, 3);
    });

    test('unreadable values fall back to the defaults', () {
      final settings = AppSettings.fromStored({
        SettingKeys.remindersEnabled: 'maybe',
        SettingKeys.defaultReminderTime: '25:00',
        SettingKeys.deadlineLeadDays: '99',
        SettingKeys.reviewDay: '8',
        SettingKeys.reviewTime: 'evening',
      });
      expect(settings, const AppSettings());
    });
  });
}
