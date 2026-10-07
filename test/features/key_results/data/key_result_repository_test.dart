import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';

import '../../../helpers/repos.dart';

void main() {
  late Repos r;
  late Objective o;
  setUp(() async {
    r = Repos();
    o = await r.objective();
  });
  tearDown(() => r.close());

  test('sort order is per objective', () async {
    final other = await r.objective(title: 'Other');
    expect((await r.numericKr(o.id)).sortOrder, 0);
    expect((await r.numericKr(o.id)).sortOrder, 1);
    expect((await r.numericKr(other.id)).sortOrder, 0);
  });

  test('watchForObjectives returns KRs of those objectives in order', () async {
    final other = await r.objective(title: 'Other');
    await r.numericKr(o.id, title: 'A');
    await r.numericKr(o.id, title: 'B');
    await r.numericKr(other.id, title: 'C');
    final krs = await r.keyResults.watchForObjectives([o.id]).first;
    expect(krs.map((k) => k.title), ['A', 'B']);
  });

  test('numeric KR keeps values and trims an empty unit to null', () async {
    final kr = await r.keyResults.create(
      objectiveId: o.id,
      title: 'Run',
      measureType: MeasureType.numeric,
      startValue: 0,
      targetValue: 100,
      currentValue: 20,
      unit: ' ',
      habitId: 'h1',
    );
    expect(kr.currentValue, 20);
    expect(kr.unit, isNull);
    expect(kr.habitId, isNull);
  });

  test('boolean KR stores achieved as 0/1 with start 0 and target 1', () async {
    final kr = await r.keyResults.create(
      objectiveId: o.id,
      title: 'Sign up',
      measureType: MeasureType.boolean,
      currentValue: 1,
      unit: 'km',
    );
    expect([kr.startValue, kr.targetValue, kr.currentValue], [0, 1, 1]);
    expect(kr.unit, isNull);
  });

  test('habit KR keeps target and habit only', () async {
    final kr = await r.keyResults.create(
      objectiveId: o.id,
      title: 'Stretch 40 times',
      measureType: MeasureType.habit,
      startValue: 3,
      targetValue: 40,
      currentValue: 5,
      habitId: 'h1',
    );
    expect(kr.targetValue, 40);
    expect(kr.habitId, 'h1');
    expect(kr.startValue, isNull);
    expect(kr.currentValue, isNull);
  });

  test('update changes the current value and bumps updated_at', () async {
    final kr = await r.numericKr(o.id);
    await r.keyResults.update(kr.copyWith(currentValue: const Value(50)));
    final stored = await r.keyResults.get(kr.id);
    expect(stored!.currentValue, 50);
    expect(stored.updatedAt.isAfter(kr.updatedAt), isTrue);
  });

  test('delete unlinks projects and habits', () async {
    final kr = await r.numericKr(o.id);
    final p = await r.projects.create(title: 'Plan runs', keyResultId: kr.id);
    final h = await r.habits.create(
      title: 'Run',
      keyResultId: kr.id,
      projectId: p.id,
      scheduleType: ScheduleType.daily,
    );

    await r.keyResults.delete(kr.id);

    expect(await r.keyResults.get(kr.id), isNull);
    expect((await r.rawProject(p.id)).keyResultId, isNull);
    final habit = await r.rawHabit(h.id);
    expect(habit.keyResultId, isNull);
    expect(habit.projectId, p.id);
  });

  group('watchHabitCheckIns', () {
    // The objective from setUp starts 2026-10-01.
    Future<(Habit, KeyResult)> habitKr() async {
      final habit = await r.habits.create(
        title: 'Run',
        scheduleType: ScheduleType.daily,
      );
      final kr = await r.keyResults.create(
        objectiveId: o.id,
        title: 'Run 20 times',
        measureType: MeasureType.habit,
        targetValue: 20,
        habitId: habit.id,
      );
      return (habit, kr);
    }

    test('counts checks from the objective start date on', () async {
      final (habit, kr) = await habitKr();
      await r.habitChecks.check(habit, CalendarDate(2026, 9, 30));
      await r.habitChecks.check(habit, CalendarDate(2026, 10, 1));
      await r.habitChecks.check(habit, CalendarDate(2026, 10, 2));

      expect(await r.keyResults.watchHabitCheckIns().first, {kr.id: 2});
    });

    test('ignores removed checks', () async {
      final (habit, kr) = await habitKr();
      await r.habitChecks.check(habit, CalendarDate(2026, 10, 2));
      await r.habitChecks.check(habit, CalendarDate(2026, 10, 3));
      await r.habitChecks.uncheck(habit.id, CalendarDate(2026, 10, 3));

      expect(await r.keyResults.watchHabitCheckIns().first, {kr.id: 1});
    });

    test('a habit KR without habit counts 0; other KRs are left out', () async {
      final kr = await r.keyResults.create(
        objectiveId: o.id,
        title: 'Meditate',
        measureType: MeasureType.habit,
        targetValue: 10,
      );
      await r.numericKr(o.id);

      expect(await r.keyResults.watchHabitCheckIns().first, {kr.id: 0});
    });
  });

  test('setProgressValue changes only the value and updated_at', () async {
    final kr = await r.numericKr(o.id);
    await r.keyResults.setProgressValue(kr.id, 55);

    final stored = await r.rawKeyResult(kr.id);
    expect(stored.currentValue, 55);
    expect(stored.updatedAt.isAfter(kr.updatedAt), isTrue);
    expect(
      stored.copyWith(currentValue: const Value(0), updatedAt: kr.updatedAt),
      kr,
    );
  });

  group('nudge', () {
    test('raises and lowers the current value by the given amount', () async {
      final kr = await r.numericKr(o.id);
      await r.keyResults.nudge(kr.id, 5);
      expect((await r.rawKeyResult(kr.id)).currentValue, 5);
      await r.keyResults.nudge(kr.id, -2);
      expect((await r.rawKeyResult(kr.id)).currentValue, 3);
    });

    test('goes past the start and the target', () async {
      final kr = await r.numericKr(o.id);
      await r.keyResults.nudge(kr.id, -1);
      expect((await r.rawKeyResult(kr.id)).currentValue, -1);
      await r.keyResults.nudge(kr.id, 150);
      expect((await r.rawKeyResult(kr.id)).currentValue, 149);
    });

    test('two quick nudges both count', () async {
      final kr = await r.numericKr(o.id);
      await Future.wait([
        r.keyResults.nudge(kr.id, 1),
        r.keyResults.nudge(kr.id, 1),
      ]);
      expect((await r.rawKeyResult(kr.id)).currentValue, 2);
    });

    test('changes nothing on a boolean KR', () async {
      final kr = await r.keyResults.create(
        objectiveId: o.id,
        title: 'Publish',
        measureType: MeasureType.boolean,
        currentValue: 0,
      );
      await r.keyResults.nudge(kr.id, 1);
      expect((await r.rawKeyResult(kr.id)).currentValue, 0);
    });
  });

  test('the step is stored on create and update', () async {
    final kr = await r.keyResults.create(
      objectiveId: o.id,
      title: 'Save',
      measureType: MeasureType.numeric,
      startValue: 0,
      targetValue: 5000,
      currentValue: 0,
      step: 50,
    );
    expect((await r.rawKeyResult(kr.id)).step, 50);
    await r.keyResults.update(kr.copyWith(step: 100));
    expect((await r.rawKeyResult(kr.id)).step, 100);
    expect((await r.numericKr(o.id)).step, 1);
  });

  test('log entries on a KR, newest first', () async {
    final kr = await r.numericKr(o.id);
    await r.logs.createManual(keyResultId: kr.id, note: 'first');
    await r.logs.createManual(keyResultId: kr.id, note: 'second');
    await r.logs.createManual(note: 'elsewhere');
    final entries = await r.logs.watchForKeyResult(kr.id).first;
    expect(entries.map((e) => e.note), ['second', 'first']);
  });
}
