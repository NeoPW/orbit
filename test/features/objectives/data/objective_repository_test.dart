import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';

import '../../../helpers/repos.dart';

void main() {
  late Repos r;
  setUp(() => r = Repos());
  tearDown(() => r.close());

  test('create adds an active objective with trimmed text', () async {
    final o = await r.objectives.create(
      title: ' Get fit ',
      description: ' Q4 ',
      startDate: CalendarDate(2026, 10, 1),
      endDate: CalendarDate(2026, 12, 31),
    );
    expect(o.status, ObjectiveStatus.active);
    expect(o.title, 'Get fit');
    expect(o.description, 'Q4');
    expect(o.sortOrder, 0);
    expect((await r.objective(title: 'Second')).sortOrder, 1);
  });

  test('watchByStatus filters by status in sort order', () async {
    final a = await r.objective(title: 'A');
    await r.objective(title: 'B');
    await r.objectives.update(a.copyWith(status: ObjectiveStatus.completed));

    final active = await r.objectives.watchByStatus({
      ObjectiveStatus.active,
    }).first;
    expect(active.map((o) => o.title), ['B']);
    final done = await r.objectives.watchByStatus({
      ObjectiveStatus.completed,
      ObjectiveStatus.archived,
    }).first;
    expect(done.map((o) => o.title), ['A']);
  });

  test('update bumps updated_at', () async {
    final o = await r.objective();
    await r.objectives.update(o.copyWith(endDate: CalendarDate(2027, 1, 31)));
    final stored = await r.objectives.get(o.id);
    expect(stored!.endDate, CalendarDate(2027, 1, 31));
    expect(stored.updatedAt.isAfter(o.updatedAt), isTrue);
  });

  test('countKeyResults counts live KRs only', () async {
    final o = await r.objective();
    await r.numericKr(o.id);
    await r.numericKr(o.id);
    final third = await r.numericKr(o.id);
    expect(await r.objectives.countKeyResults(o.id), 3);
    await r.keyResults.delete(third.id);
    expect(await r.objectives.countKeyResults(o.id), 2);
  });

  test('delete cascades to KRs and unlinks projects and habits', () async {
    final o = await r.objective();
    final other = await r.objective(title: 'Other');
    final kr = await r.numericKr(o.id);
    final otherKr = await r.numericKr(other.id);
    final linked = await r.projects.create(title: 'Linked', keyResultId: kr.id);
    final untouched = await r.projects.create(
      title: 'Untouched',
      keyResultId: otherKr.id,
    );
    final habit = await r.habits.create(
      title: 'Run',
      keyResultId: kr.id,
      scheduleType: ScheduleType.daily,
    );

    await r.objectives.delete(o.id);

    expect((await r.rawObjective(o.id)).deletedAt, isNotNull);
    expect((await r.rawKeyResult(kr.id)).deletedAt, isNotNull);
    final project = await r.rawProject(linked.id);
    expect(project.keyResultId, isNull);
    expect(project.deletedAt, isNull);
    expect((await r.rawHabit(habit.id)).keyResultId, isNull);
    expect((await r.rawProject(untouched.id)).keyResultId, otherKr.id);
    expect((await r.rawKeyResult(otherKr.id)).deletedAt, isNull);
  });

  test('soft-deleted objectives are not emitted', () async {
    final o = await r.objective();
    await r.objectives.delete(o.id);
    expect(await r.objectives.watchAll().first, isEmpty);
    expect(await r.objectives.watch(o.id).first, isNull);
  });
}
