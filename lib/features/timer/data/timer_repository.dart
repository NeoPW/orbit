import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/db/app_database.dart';
import '../../../core/db/database_providers.dart';
import '../../../core/db/ids.dart' show idGeneratorProvider, naturalKeyId;
import '../../../core/db/repository_support.dart';
import '../../../core/time/clock.dart' show clockProvider;
import '../../log/data/log_repository.dart';
import '../domain/timer_time.dart';

part 'timer_repository.g.dart';

/// What a timer runs for: an active project or an open task.
sealed class TimerTarget {
  const TimerTarget(this.id);

  final String id;
}

class TimerForProject extends TimerTarget {
  const TimerForProject(super.id);
}

class TimerForTask extends TimerTarget {
  const TimerForTask(super.id);
}

/// The one timer row of an account: a fixed ID, so a timer started on two
/// devices is one record after sync and the later start wins.
final timerId = naturalKeyId('timer');

/// The work timer (work-timer spec). At most one runs; stopping logs its
/// time, discarding ends it without a log entry.
class TimerRepository extends Repository {
  TimerRepository(super.db, super.clock, super.newId)
    : _logs = LogRepository(db, clock, newId);

  final LogRepository _logs;

  SimpleSelectStatement<$TimersTable, WorkTimer> _running() =>
      db.select(db.timers)..where((t) => t.id.equals(timerId) & alive(t));

  Stream<WorkTimer?> watchRunning() => _running().watchSingleOrNull();

  Future<WorkTimer?> running() => _running().getSingleOrNull();

  /// Starts a timer for [target] now, first stopping (and logging) a
  /// running one.
  Future<WorkTimer> start(TimerTarget target) => db.transaction(() async {
    final current = await running();
    if (current != null) await _stop(current);
    final existing = await (db.select(
      db.timers,
    )..where((t) => t.id.equals(timerId))).getSingleOrNull();
    final now = clock();
    final timer = WorkTimer(
      id: timerId,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      projectId: target is TimerForProject ? target.id : null,
      taskId: target is TimerForTask ? target.id : null,
      startedAt: now,
    );
    // A companion, so the nulls (deleted_at, the other target) are written.
    await db.into(db.timers).insertOnConflictUpdate(timer.toCompanion(false));
    return timer;
  });

  /// Stops the running timer and logs its time; null without one.
  Future<LogEntry?> stop() => db.transaction(() async {
    final current = await running();
    return current == null ? null : _stop(current);
  });

  /// Ends the running timer without a log entry.
  Future<void> discard() =>
      softDeleteWhere(db.timers, (t) => t.id.equals(timerId));

  Future<LogEntry> _stop(WorkTimer timer) async {
    final minutes = loggedMinutes(timerElapsed(timer.startedAt, clock()));
    final taskId = timer.taskId;
    final task = taskId == null
        ? null
        : await (db.select(
            db.tasks,
          )..where((t) => t.id.equals(taskId))).getSingleOrNull();
    final entry = await _logs.add(
      projectId: task == null ? timer.projectId : task.projectId,
      keyResultId: task?.keyResultId,
      taskId: taskId,
      durationMinutes: minutes,
      source: LogSource.timer,
      occurredAt: timer.startedAt,
    );
    await softDeleteWhere(db.timers, (t) => t.id.equals(timerId));
    return entry;
  }
}

@Riverpod(keepAlive: true)
TimerRepository timerRepository(Ref ref) => TimerRepository(
  ref.watch(appDatabaseProvider),
  ref.watch(clockProvider),
  ref.watch(idGeneratorProvider),
);

/// The running timer, if any.
@riverpod
Stream<WorkTimer?> runningTimer(Ref ref) =>
    ref.watch(timerRepositoryProvider).watchRunning();
