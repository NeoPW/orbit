import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/db/app_database.dart';
import '../../../core/db/database_providers.dart';
import '../../../core/db/ids.dart' show idGeneratorProvider;
import '../../../core/db/repository_support.dart';
import '../../../core/time/clock.dart' show clockProvider;

part 'log_repository.g.dart';

/// Log entries: work done, logged manually, by habit checks or by
/// completing tasks.
class LogRepository extends Repository {
  LogRepository(super.db, super.clock, super.newId);

  /// Adds a log entry at the current time. Used for every source; habit
  /// checks and task completions call it inside their own transaction.
  Future<LogEntry> add({
    String? projectId,
    String? keyResultId,
    int? durationMinutes,
    String note = '',
    required LogSource source,
  }) {
    final now = clock();
    return db
        .into(db.logEntries)
        .insertReturning(
          LogEntriesCompanion.insert(
            id: newId(),
            createdAt: now,
            updatedAt: now,
            projectId: Value(projectId),
            keyResultId: Value(keyResultId),
            occurredAt: now,
            durationMinutes: Value(durationMinutes),
            note: Value(note.trim()),
            source: source,
          ),
        );
  }

  /// Logs work on a project by hand (quick log, "Log work").
  Future<LogEntry> createManual({
    required String projectId,
    int? durationMinutes,
    String note = '',
  }) => add(
    projectId: projectId,
    durationMinutes: durationMinutes,
    note: note,
    source: LogSource.manual,
  );

  /// The project's entries, most recent first.
  Stream<List<LogEntry>> watchForProject(String projectId) =>
      (db.select(db.logEntries)
            ..where((e) => alive(e) & e.projectId.equals(projectId))
            ..orderBy([
              (e) => OrderingTerm.desc(e.occurredAt),
              (e) => OrderingTerm.desc(e.createdAt),
            ]))
          .watch();

  /// All entries with `occurred_at` in [from, to).
  Stream<List<LogEntry>> watchBetween(DateTime from, DateTime to) =>
      (db.select(db.logEntries)..where(
            (e) =>
                alive(e) &
                e.occurredAt.isBiggerOrEqualValue(from.toUtc()) &
                e.occurredAt.isSmallerThanValue(to.toUtc()),
          ))
          .watch();

  /// The time of each project's most recent entry, by project ID. Projects
  /// without entries are missing from the map.
  Stream<Map<String, DateTime>> watchLastLoggedAt() {
    final projectId = db.logEntries.projectId;
    final latest = db.logEntries.occurredAt.max();
    final query = db.selectOnly(db.logEntries)
      ..addColumns([projectId, latest])
      ..where(alive(db.logEntries) & projectId.isNotNull())
      ..groupBy([projectId]);
    return query.watch().map(
      (rows) => {
        for (final row in rows) row.read(projectId)!: row.read(latest)!,
      },
    );
  }

  /// Soft-deletes the entry. An entry created by a habit check takes the
  /// check with it, so the habit is unchecked for that date.
  Future<void> delete(String id) => db.transaction(() async {
    await softDeleteWhere(db.habitChecks, (c) => c.logEntryId.equals(id));
    await softDeleteWhere(db.logEntries, (e) => e.id.equals(id));
  });
}

@Riverpod(keepAlive: true)
LogRepository logRepository(Ref ref) => LogRepository(
  ref.watch(appDatabaseProvider),
  ref.watch(clockProvider),
  ref.watch(idGeneratorProvider),
);

/// A project's log entries, most recent first.
@riverpod
Stream<List<LogEntry>> projectLog(Ref ref, String projectId) =>
    ref.watch(logRepositoryProvider).watchForProject(projectId);

/// The time of each project's most recent log entry.
@riverpod
Stream<Map<String, DateTime>> lastLoggedAt(Ref ref) =>
    ref.watch(logRepositoryProvider).watchLastLoggedAt();
