import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';

import '../../../helpers/repos.dart';

void main() {
  late Repos r;
  setUp(() => r = Repos());
  tearDown(() => r.close());

  test('create without any link is allowed', () async {
    final h = await r.habits.create(
      title: ' Meditate ',
      scheduleType: ScheduleType.daily,
    );
    expect(h.title, 'Meditate');
    expect(h.projectId, isNull);
    expect(h.keyResultId, isNull);
    expect(h.active, isTrue);
  });

  test('keeps only the schedule fields of the schedule type', () async {
    final weekdays = await r.habits.create(
      title: 'Gym',
      scheduleType: ScheduleType.weekdays,
      weekdays: {1, 3, 5},
      timesPerWeek: 3,
    );
    expect(weekdays.weekdays, {1, 3, 5});
    expect(weekdays.timesPerWeek, isNull);

    final times = await r.habits.create(
      title: 'Read',
      scheduleType: ScheduleType.timesPerWeek,
      weekdays: {1},
      timesPerWeek: 4,
    );
    expect(times.weekdays, isNull);
    expect(times.timesPerWeek, 4);
  });

  test('stores reminder time and active flag', () async {
    final h = await r.habits.create(
      title: 'Stretch',
      scheduleType: ScheduleType.daily,
      reminderTime: '07:30',
    );
    await r.habits.update(h.copyWith(active: false));
    final stored = await r.habits.get(h.id);
    expect(stored!.reminderTime, '07:30');
    expect(stored.active, isFalse);
    expect(stored.updatedAt.isAfter(h.updatedAt), isTrue);

    await r.habits.update(stored.copyWith(reminderTime: const Value(null)));
    expect((await r.habits.get(h.id))!.reminderTime, isNull);
  });

  test('watchAll lists active habits first, then by title', () async {
    final z = await r.habits.create(
      title: 'z',
      scheduleType: ScheduleType.daily,
    );
    await r.habits.create(title: 'B', scheduleType: ScheduleType.daily);
    await r.habits.create(title: 'a', scheduleType: ScheduleType.daily);
    await r.habits.update(z.copyWith(active: false));
    final all = await r.habits.watchAll().first;
    expect(all.map((h) => h.title), ['a', 'B', 'z']);

    await r.habits.create(
      title: 'A inactive',
      scheduleType: ScheduleType.daily,
      active: false,
    );
    final again = await r.habits.watchAll().first;
    expect(again.map((h) => h.title), ['a', 'B', 'A inactive', 'z']);
  });

  test('delete unlinks habit KRs', () async {
    final o = await r.objective();
    final h = await r.habits.create(
      title: 'Run',
      scheduleType: ScheduleType.daily,
    );
    final kr = await r.keyResults.create(
      objectiveId: o.id,
      title: 'Run 40 times',
      measureType: MeasureType.habit,
      targetValue: 40,
      habitId: h.id,
    );

    await r.habits.delete(h.id);

    expect(await r.habits.get(h.id), isNull);
    final stored = await r.keyResults.get(kr.id);
    expect(stored, isNotNull);
    expect(stored!.habitId, isNull);
  });
}
