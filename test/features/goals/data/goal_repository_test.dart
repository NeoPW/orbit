import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/features/tasks/domain/task_assignment.dart';

import '../../../helpers/repos.dart';

void main() {
  late Repos r;
  setUp(() => r = Repos());
  tearDown(() => r.close());

  test('create adds an active goal with trimmed text', () async {
    final g = await r.goals.create(
      title: ' Get fit ',
      description: ' Q4 ',
      startDate: CalendarDate(2026, 10, 1),
      endDate: CalendarDate(2026, 12, 31),
      color: '#FF7A9C',
    );
    expect(g.status, GoalStatus.active);
    expect(g.title, 'Get fit');
    expect(g.description, 'Q4');
    expect(g.color, '#FF7A9C');
    expect(g.sortOrder, 0);
    expect((await r.goal(title: 'Second')).sortOrder, 1);
  });

  test('watchByStatus filters by status in sort order', () async {
    final a = await r.goal(title: 'A');
    await r.goal(title: 'B');
    await r.goals.update(a.copyWith(status: GoalStatus.completed));

    final active = await r.goals.watchByStatus({GoalStatus.active}).first;
    expect(active.map((g) => g.title), ['B']);
    final done = await r.goals.watchByStatus({
      GoalStatus.completed,
      GoalStatus.archived,
    }).first;
    expect(done.map((g) => g.title), ['A']);
  });

  test('update bumps updated_at and can clear the color', () async {
    final g = await r.goals.create(
      title: 'Get fit',
      startDate: CalendarDate(2026, 10, 1),
      endDate: CalendarDate(2026, 12, 31),
      color: '#FF7A9C',
    );
    await r.goals.update(
      g.copyWith(endDate: CalendarDate(2027, 1, 31), color: const Value(null)),
    );
    final stored = await r.goals.get(g.id);
    expect(stored!.endDate, CalendarDate(2027, 1, 31));
    expect(stored.color, isNull);
    expect(stored.updatedAt.isAfter(g.updatedAt), isTrue);
  });

  test('countMeasures counts live measures only', () async {
    final g = await r.goal();
    await r.numericMeasure(g.id);
    await r.numericMeasure(g.id);
    final third = await r.numericMeasure(g.id);
    expect(await r.goals.countMeasures(g.id), 3);
    await r.measures.delete(third.id);
    expect(await r.goals.countMeasures(g.id), 2);
  });

  test(
    'delete cascades to measures and unlinks projects, tasks and habits',
    () async {
      final g = await r.goal();
      final other = await r.goal(title: 'Other');
      final m = await r.numericMeasure(g.id);
      final linked = await r.projects.create(title: 'Linked', goalId: g.id);
      final untouched = await r.projects.create(
        title: 'Untouched',
        goalId: other.id,
      );
      final task = await r.tasks.create(
        title: 'Book physio',
        assignment: ForGoal(g.id),
      );
      final habit = await r.habits.create(
        title: 'Run',
        goalId: g.id,
        scheduleType: ScheduleType.daily,
      );

      await r.goals.delete(g.id);

      expect((await r.rawGoal(g.id)).deletedAt, isNotNull);
      expect((await r.rawMeasure(m.id)).deletedAt, isNotNull);
      final project = await r.rawProject(linked.id);
      expect(project.goalId, isNull);
      expect(project.deletedAt, isNull);
      final standalone = await r.rawTask(task.id);
      expect(standalone.goalId, isNull);
      expect(standalone.deletedAt, isNull);
      expect((await r.rawHabit(habit.id)).goalId, isNull);
      expect((await r.rawProject(untouched.id)).goalId, other.id);
    },
  );

  test('soft-deleted goals are not emitted', () async {
    final g = await r.goal();
    await r.goals.delete(g.id);
    expect(await r.goals.watchAll().first, isEmpty);
    expect(await r.goals.watch(g.id).first, isNull);
  });
}
