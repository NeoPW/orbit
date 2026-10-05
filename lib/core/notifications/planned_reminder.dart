/// What a reminder is about; each kind has its own Android channel.
enum ReminderKind { habit, deadline }

/// A notification to show at a local wall-clock time.
class PlannedReminder {
  const PlannedReminder({
    required this.at,
    required this.kind,
    required this.title,
    required this.body,
    required this.route,
  });

  /// Local date and time (not UTC).
  final DateTime at;
  final ReminderKind kind;
  final String title;
  final String body;

  /// The screen to open when the notification is tapped.
  final String route;

  @override
  bool operator ==(Object other) =>
      other is PlannedReminder &&
      other.at == at &&
      other.kind == kind &&
      other.title == title &&
      other.body == body &&
      other.route == route;

  @override
  int get hashCode => Object.hash(at, kind, title, body, route);

  @override
  String toString() => 'PlannedReminder($at, $kind, $title, $body, $route)';
}
