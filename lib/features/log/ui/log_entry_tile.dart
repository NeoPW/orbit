import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/db/app_database.dart';
import '../../../core/time/date_format.dart';
import '../../../core/widgets/confirm_delete.dart';
import '../data/log_repository.dart';
import '../domain/duration.dart';

String logSourceLabel(LogSource source) => switch (source) {
  LogSource.manual => 'Manual',
  LogSource.habit => 'Habit',
  LogSource.task => 'Task',
  LogSource.timer => 'Timer',
};

/// A log entry: note, date and time, duration and source, with delete.
class LogEntryTile extends ConsumerWidget {
  const LogEntryTile({super.key, required this.entry});

  final LogEntry entry;

  Future<void> _delete(BuildContext context, WidgetRef ref) async {
    final logs = ref.read(logRepositoryProvider);
    final confirmed = await confirmDelete(
      context,
      title: 'Delete log entry?',
      message: entry.source == LogSource.habit
          ? 'This also unchecks the habit for that day.'
          : 'This removes the entry from the log.',
    );
    if (confirmed) await logs.delete(entry.id);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final occurred = entry.occurredAt;
    final duration = entry.durationMinutes;
    final details = [
      '${formatDate(CalendarDate.fromDateTime(occurred))} '
          '${formatTime(occurred)}',
      if (duration != null) formatDuration(duration),
      logSourceLabel(entry.source),
    ];
    return ListTile(
      leading: Icon(switch (entry.source) {
        LogSource.manual => Icons.edit_note,
        LogSource.habit => Icons.repeat,
        LogSource.task => Icons.task_alt,
        LogSource.timer => Icons.timer_outlined,
      }),
      title: Text(entry.note.isEmpty ? 'Work logged' : entry.note),
      subtitle: Text(details.join(' · ')),
      trailing: IconButton(
        tooltip: 'Delete log entry',
        icon: const Icon(Icons.delete_outline),
        onPressed: () => _delete(context, ref),
      ),
    );
  }
}
