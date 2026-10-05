/// Durations of log entries, in whole minutes (work-log spec).
library;

enum DurationError { notAWholeNumber, outOfRange }

/// The longest duration that can be logged: one day.
const maxDurationMinutes = 1440;

/// Checks a duration as typed by the user; returns null when valid. Empty
/// input is valid (no duration).
DurationError? validateDuration(String text) {
  final trimmed = text.trim();
  if (trimmed.isEmpty) return null;
  final minutes = int.tryParse(trimmed);
  if (minutes == null) return DurationError.notAWholeNumber;
  if (minutes < 1 || minutes > maxDurationMinutes) {
    return DurationError.outOfRange;
  }
  return null;
}

/// The minutes of a valid duration input, or null when it is empty.
int? parseDuration(String text) {
  final trimmed = text.trim();
  return trimmed.isEmpty ? null : int.parse(trimmed);
}

/// A human-readable duration, e.g. "45 min", "2 h", "1 h 30 min".
String formatDuration(int minutes) {
  final hours = minutes ~/ 60;
  final rest = minutes % 60;
  if (hours == 0) return '$rest min';
  if (rest == 0) return '$hours h';
  return '$hours h $rest min';
}
