import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/db/ids.dart';

import '../../../helpers/repos.dart';

void main() {
  late Repos r;
  setUp(() => r = Repos());
  tearDown(() => r.close());

  final today = CalendarDate(2026, 10, 5);

  Future<Habit> runHabit() => r.habits.create(
    title: 'Run',
    projectId: 'p1',
    keyResultId: 'kr1',
    scheduleType: ScheduleType.daily,
  );

  test('check creates a check and a habit log entry', () async {
    final habit = await runHabit();
    final check = await r.habitChecks.check(habit, today);

    expect(check.habitId, habit.id);
    expect(check.date, today);
    final entry = await r.rawLogEntry(check.logEntryId!);
    expect(entry.source, LogSource.habit);
    expect(entry.projectId, 'p1');
    expect(entry.keyResultId, 'kr1');
    expect(entry.note, 'Run');
    expect(entry.durationMinutes, isNull);
    expect(await r.logs.watchForProject('p1').first, hasLength(1));
  });

  test('checking twice keeps one check and one log entry', () async {
    final habit = await runHabit();
    final first = await r.habitChecks.check(habit, today);
    final second = await r.habitChecks.check(habit, today);

    expect(second.id, first.id);
    expect(await r.habitChecks.watchSince(today).first, hasLength(1));
    expect(await r.logs.watchForProject('p1').first, hasLength(1));
  });

  test('uncheck removes the check and its log entry', () async {
    final habit = await runHabit();
    final check = await r.habitChecks.check(habit, today);
    await r.habitChecks.uncheck(habit.id, today);

    expect(await r.habitChecks.watchSince(today).first, isEmpty);
    expect((await r.rawLogEntry(check.logEntryId!)).deletedAt, isNotNull);
    expect(await r.logs.watchForProject('p1').first, isEmpty);
  });

  test('re-checking after uncheck revives the removed check', () async {
    final habit = await runHabit();
    final first = await r.habitChecks.check(habit, today);
    await r.habitChecks.uncheck(habit.id, today);
    final again = await r.habitChecks.check(habit, today);

    expect(again.id, first.id);
    expect(again.deletedAt, isNull);
    expect(again.logEntryId, isNot(first.logEntryId));
    expect(await r.rawHabitChecks(), hasLength(1));
    expect(await r.habitChecks.watchSince(today).first, hasLength(1));
    expect(await r.logs.watchForProject('p1').first, hasLength(1));
  });

  test('watchSince excludes earlier dates', () async {
    final habit = await runHabit();
    await r.habitChecks.check(habit, today.addDays(-1));
    await r.habitChecks.check(habit, today);

    final checks = await r.habitChecks.watchSince(today).first;
    expect(checks.map((c) => c.date), [today]);
  });

  test('deleting the log entry unchecks the habit for that date', () async {
    final habit = await runHabit();
    final check = await r.habitChecks.check(habit, today);
    await r.logs.delete(check.logEntryId!);

    expect(await r.habitChecks.watchSince(today).first, isEmpty);
    // The habit can be checked again afterwards.
    await r.habitChecks.check(habit, today);
    expect(await r.habitChecks.watchSince(today).first, hasLength(1));
  });

  test('the ID is derived from habit and date', () async {
    final habit = await runHabit();
    final check = await r.habitChecks.check(habit, today);
    expect(check.id, naturalKeyId('habit_check:${habit.id}:2026-10-05'));
  });
}
