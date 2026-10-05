/// Local settings (settings spec) and how they are stored as text.
library;

/// A local time of day, e.g. a reminder time.
typedef TimeOfDayValue = ({int hour, int minute});

/// Parses `HH:mm` (00:00–23:59); null for anything else.
TimeOfDayValue? parseTimeOfDay(String text) {
  final match = RegExp(r'^(\d{2}):(\d{2})$').firstMatch(text);
  if (match == null) return null;
  final hour = int.parse(match.group(1)!);
  final minute = int.parse(match.group(2)!);
  if (hour > 23 || minute > 59) return null;
  return (hour: hour, minute: minute);
}

/// Formats a time of day as `HH:mm`.
String formatTimeOfDay(TimeOfDayValue time) =>
    '${time.hour.toString().padLeft(2, '0')}:'
    '${time.minute.toString().padLeft(2, '0')}';

enum LeadDaysError { notAWholeNumber, outOfRange }

const minLeadDays = 1;
const maxLeadDays = 30;

/// Checks a lead time as typed by the user; returns null when valid.
LeadDaysError? validateLeadDays(String text) {
  final days = int.tryParse(text.trim());
  if (days == null) return LeadDaysError.notAWholeNumber;
  if (days < minLeadDays || days > maxLeadDays) return LeadDaysError.outOfRange;
  return null;
}

/// The storage keys of the settings table.
abstract final class SettingKeys {
  static const remindersEnabled = 'reminders_enabled';
  static const defaultReminderTime = 'default_reminder_time';
  static const deadlineLeadDays = 'deadline_lead_days';
  static const reviewDay = 'review_day';
  static const reviewTime = 'review_time';
}

/// All settings with their values; missing or unreadable stored values are
/// replaced by the defaults.
class AppSettings {
  const AppSettings({
    this.remindersEnabled = true,
    this.defaultReminderTime = (hour: 8, minute: 0),
    this.deadlineLeadDays = 7,
    this.reviewDay = DateTime.sunday,
    this.reviewTime = (hour: 18, minute: 0),
  });

  /// Reads the stored key-value pairs.
  factory AppSettings.fromStored(Map<String, String> stored) {
    const defaults = AppSettings();
    final enabled = stored[SettingKeys.remindersEnabled];
    final time = stored[SettingKeys.defaultReminderTime];
    final leadDays = int.tryParse(stored[SettingKeys.deadlineLeadDays] ?? '');
    final reviewDay = int.tryParse(stored[SettingKeys.reviewDay] ?? '');
    final reviewTime = stored[SettingKeys.reviewTime];
    return AppSettings(
      remindersEnabled: switch (enabled) {
        'true' => true,
        'false' => false,
        _ => defaults.remindersEnabled,
      },
      defaultReminderTime:
          (time == null ? null : parseTimeOfDay(time)) ??
          defaults.defaultReminderTime,
      deadlineLeadDays:
          leadDays != null && leadDays >= minLeadDays && leadDays <= maxLeadDays
          ? leadDays
          : defaults.deadlineLeadDays,
      reviewDay: reviewDay != null && reviewDay >= 1 && reviewDay <= 7
          ? reviewDay
          : defaults.reviewDay,
      reviewTime:
          (reviewTime == null ? null : parseTimeOfDay(reviewTime)) ??
          defaults.reviewTime,
    );
  }

  final bool remindersEnabled;
  final TimeOfDayValue defaultReminderTime;
  final int deadlineLeadDays;

  /// ISO weekday of the weekly review reminder (Monday = 1).
  final int reviewDay;
  final TimeOfDayValue reviewTime;

  @override
  bool operator ==(Object other) =>
      other is AppSettings &&
      other.remindersEnabled == remindersEnabled &&
      other.defaultReminderTime == defaultReminderTime &&
      other.deadlineLeadDays == deadlineLeadDays &&
      other.reviewDay == reviewDay &&
      other.reviewTime == reviewTime;

  @override
  int get hashCode => Object.hash(
    remindersEnabled,
    defaultReminderTime,
    deadlineLeadDays,
    reviewDay,
    reviewTime,
  );
}
