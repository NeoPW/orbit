import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/db/app_database.dart';
import '../../../core/db/database_providers.dart';
import '../../../core/db/ids.dart' show idGeneratorProvider;
import '../../../core/db/repository_support.dart';
import '../../../core/time/clock.dart' show clockProvider;
import '../../log/data/log_repository.dart';

part 'habit_check_repository.g.dart';

/// Check-ins of habits. Every check has a log entry (source habit) that is
/// created and removed together with it.
class HabitCheckRepository extends Repository {
  HabitCheckRepository(super.db, super.clock, super.newId)
    : _logs = LogRepository(db, clock, newId);

  final LogRepository _logs;

  /// Live checks on or after [from], of all habits.
  Stream<List<HabitCheck>> watchSince(CalendarDate from) =>
      (db.select(
            db.habitChecks,
          )..where((c) => alive(c) & c.date.isBiggerOrEqualValue(from.toIso())))
          .watch();

  /// Checks [habit] on [date] and logs it. Does nothing if it is already
  /// checked on that date.
  ///
  /// `(habit_id, date)` is unique across soft-deleted rows, so a check that
  /// was removed earlier is revived instead of inserted again.
  Future<HabitCheck> check(Habit habit, CalendarDate date) =>
      db.transaction(() async {
        final existing =
            await (db.select(db.habitChecks)..where(
                  (c) => c.habitId.equals(habit.id) & c.date.equalsValue(date),
                ))
                .getSingleOrNull();
        if (existing != null && existing.deletedAt == null) return existing;

        final entry = await _logs.add(
          projectId: habit.projectId,
          keyResultId: habit.keyResultId,
          note: habit.title,
          source: LogSource.habit,
        );
        final now = clock();
        if (existing != null) {
          final revived = existing.copyWith(
            deletedAt: const Value(null),
            logEntryId: Value(entry.id),
            updatedAt: now,
          );
          await db.update(db.habitChecks).replace(revived);
          return revived;
        }
        return db
            .into(db.habitChecks)
            .insertReturning(
              HabitChecksCompanion.insert(
                id: newId(),
                createdAt: now,
                updatedAt: now,
                habitId: habit.id,
                date: date,
                logEntryId: Value(entry.id),
              ),
            );
      });

  /// Removes the check of [habitId] on [date] and its log entry.
  Future<void> uncheck(String habitId, CalendarDate date) =>
      db.transaction(() async {
        final check =
            await (db.select(db.habitChecks)..where(
                  (c) =>
                      alive(c) &
                      c.habitId.equals(habitId) &
                      c.date.equalsValue(date),
                ))
                .getSingleOrNull();
        if (check == null) return;
        await softDeleteWhere(db.habitChecks, (c) => c.id.equals(check.id));
        final logEntryId = check.logEntryId;
        if (logEntryId != null) await _logs.delete(logEntryId);
      });
}

@Riverpod(keepAlive: true)
HabitCheckRepository habitCheckRepository(Ref ref) => HabitCheckRepository(
  ref.watch(appDatabaseProvider),
  ref.watch(clockProvider),
  ref.watch(idGeneratorProvider),
);

/// Live checks of all habits on or after [from].
@riverpod
Stream<List<HabitCheck>> habitChecksSince(Ref ref, CalendarDate from) =>
    ref.watch(habitCheckRepositoryProvider).watchSince(from);
