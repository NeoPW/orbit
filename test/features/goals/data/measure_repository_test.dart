import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';

import '../../../helpers/repos.dart';

void main() {
  late Repos r;
  late Goal g;
  setUp(() async {
    r = Repos();
    g = await r.goal();
  });
  tearDown(() => r.close());

  test('sort order is per goal', () async {
    final other = await r.goal(title: 'Other');
    expect((await r.numericMeasure(g.id)).sortOrder, 0);
    expect((await r.numericMeasure(g.id)).sortOrder, 1);
    expect((await r.numericMeasure(other.id)).sortOrder, 0);
  });

  test(
    'numeric measure keeps values and trims an empty unit to null',
    () async {
      final m = await r.measures.create(
        goalId: g.id,
        title: 'Run',
        measureType: MeasureType.numeric,
        startValue: 0,
        targetValue: 100,
        currentValue: 20,
        unit: ' ',
        habitId: 'h1',
      );
      expect(m.currentValue, 20);
      expect(m.unit, isNull);
      expect(m.habitId, isNull);
    },
  );

  test(
    'boolean measure stores achieved as 0/1 with start 0 and target 1',
    () async {
      final m = await r.measures.create(
        goalId: g.id,
        title: 'Sign up',
        measureType: MeasureType.boolean,
        currentValue: 1,
        unit: 'km',
      );
      expect([m.startValue, m.targetValue, m.currentValue], [0, 1, 1]);
      expect(m.unit, isNull);
    },
  );

  test('habit measure keeps target and habit only', () async {
    final m = await r.measures.create(
      goalId: g.id,
      title: 'Stretch 40 times',
      measureType: MeasureType.habit,
      startValue: 3,
      targetValue: 40,
      currentValue: 5,
      habitId: 'h1',
    );
    expect(m.targetValue, 40);
    expect(m.habitId, 'h1');
    expect(m.startValue, isNull);
    expect(m.currentValue, isNull);
  });

  test('update changes the current value and bumps updated_at', () async {
    final m = await r.numericMeasure(g.id);
    await r.measures.update(m.copyWith(currentValue: const Value(50)));
    final stored = await r.measures.get(m.id);
    expect(stored!.currentValue, 50);
    expect(stored.updatedAt.isAfter(m.updatedAt), isTrue);
  });

  test('delete soft-deletes only the measure', () async {
    final m = await r.numericMeasure(g.id);
    final other = await r.numericMeasure(g.id, title: 'Swim');
    await r.measures.delete(m.id);
    expect(await r.measures.get(m.id), isNull);
    expect((await r.rawMeasure(m.id)).deletedAt, isNotNull);
    expect(await r.measures.get(other.id), isNotNull);
  });

  group('watchHabitCheckIns', () {
    // The goal from setUp starts 2026-10-01.
    Future<(Habit, Measure)> habitMeasure() async {
      final habit = await r.habits.create(
        title: 'Run',
        scheduleType: ScheduleType.daily,
      );
      final m = await r.measures.create(
        goalId: g.id,
        title: 'Run 20 times',
        measureType: MeasureType.habit,
        targetValue: 20,
        habitId: habit.id,
      );
      return (habit, m);
    }

    test("counts checks from the goal's start date on", () async {
      final (habit, m) = await habitMeasure();
      await r.habitChecks.check(habit, CalendarDate(2026, 9, 30));
      await r.habitChecks.check(habit, CalendarDate(2026, 10, 1));
      await r.habitChecks.check(habit, CalendarDate(2026, 10, 2));

      expect(await r.measures.watchHabitCheckIns().first, {m.id: 2});
    });

    test('ignores removed checks', () async {
      final (habit, m) = await habitMeasure();
      await r.habitChecks.check(habit, CalendarDate(2026, 10, 2));
      await r.habitChecks.check(habit, CalendarDate(2026, 10, 3));
      await r.habitChecks.uncheck(habit.id, CalendarDate(2026, 10, 3));

      expect(await r.measures.watchHabitCheckIns().first, {m.id: 1});
    });

    test(
      'a habit measure without habit counts 0; other measures are left out',
      () async {
        final m = await r.measures.create(
          goalId: g.id,
          title: 'Meditate',
          measureType: MeasureType.habit,
          targetValue: 10,
        );
        await r.numericMeasure(g.id);

        expect(await r.measures.watchHabitCheckIns().first, {m.id: 0});
      },
    );
  });

  test('setProgressValue changes only the value and updated_at', () async {
    final m = await r.numericMeasure(g.id);
    await r.measures.setProgressValue(m.id, 55);

    final stored = await r.rawMeasure(m.id);
    expect(stored.currentValue, 55);
    expect(stored.updatedAt.isAfter(m.updatedAt), isTrue);
    expect(
      stored.copyWith(currentValue: const Value(0), updatedAt: m.updatedAt),
      m,
    );
  });

  group('nudge', () {
    test('raises and lowers the current value by the given amount', () async {
      final m = await r.numericMeasure(g.id);
      await r.measures.nudge(m.id, 5);
      expect((await r.rawMeasure(m.id)).currentValue, 5);
      await r.measures.nudge(m.id, -2);
      expect((await r.rawMeasure(m.id)).currentValue, 3);
    });

    test('goes past the start and the target', () async {
      final m = await r.numericMeasure(g.id);
      await r.measures.nudge(m.id, -1);
      expect((await r.rawMeasure(m.id)).currentValue, -1);
      await r.measures.nudge(m.id, 150);
      expect((await r.rawMeasure(m.id)).currentValue, 149);
    });

    test('two quick nudges both count', () async {
      final m = await r.numericMeasure(g.id);
      await Future.wait([r.measures.nudge(m.id, 1), r.measures.nudge(m.id, 1)]);
      expect((await r.rawMeasure(m.id)).currentValue, 2);
    });

    test('changes nothing on a boolean measure', () async {
      final m = await r.measures.create(
        goalId: g.id,
        title: 'Publish',
        measureType: MeasureType.boolean,
        currentValue: 0,
      );
      await r.measures.nudge(m.id, 1);
      expect((await r.rawMeasure(m.id)).currentValue, 0);
    });
  });

  test('the step is stored on create and update', () async {
    final m = await r.measures.create(
      goalId: g.id,
      title: 'Save',
      measureType: MeasureType.numeric,
      startValue: 0,
      targetValue: 5000,
      currentValue: 0,
      step: 50,
    );
    expect((await r.rawMeasure(m.id)).step, 50);
    await r.measures.update(m.copyWith(step: 100));
    expect((await r.rawMeasure(m.id)).step, 100);
    expect((await r.numericMeasure(g.id)).step, 1);
  });
}
