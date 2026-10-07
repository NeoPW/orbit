import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/time/clock.dart';
import 'package:orbit/core/time/today.dart';
import 'package:orbit/features/home/data/home_providers.dart';
import 'package:orbit/features/tasks/domain/task_assignment.dart';

import '../../../helpers/provider_container.dart';
import '../../../helpers/repos.dart';

void main() {
  // todayProvider listens to the app lifecycle.
  TestWidgetsFlutterBinding.ensureInitialized();

  late Repos r;
  late ProviderContainer container;
  // Monday 2026-10-05, 09:00 local.
  var now = DateTime(2026, 10, 5, 9);

  setUp(() {
    r = Repos();
    now = DateTime(2026, 10, 5, 9);
    container = containerWith(
      r.db,
      overrides: [clockProvider.overrideWithValue(() => now.toUtc())],
    );
  });
  tearDown(() async {
    container.dispose();
    await r.close();
  });

  test(
    'a habit checked yesterday is unchecked after the date changes',
    () async {
      final habit = await r.habits.create(
        title: 'Stretch',
        scheduleType: ScheduleType.daily,
      );
      await r.habitChecks.check(habit, CalendarDate(2026, 10, 5));

      final checked = await valueWhere(
        container,
        homeHabitsProvider,
        (habits) => habits.isNotEmpty && habits.single.checkedToday,
      );
      expect(checked.single.habit.title, 'Stretch');

      now = DateTime(2026, 10, 6, 7);
      container.read(todayProvider.notifier).refresh();

      final nextDay = await valueWhere(
        container,
        homeHabitsProvider,
        (habits) => habits.isNotEmpty && !habits.single.checkedToday,
      );
      expect(nextDay.single.habit.title, 'Stretch');
    },
  );

  test(
    'times-per-week habits leave Home once the week target is reached',
    () async {
      final habit = await r.habits.create(
        title: 'Swim',
        scheduleType: ScheduleType.timesPerWeek,
        timesPerWeek: 1,
      );
      await r.habitChecks.check(habit, CalendarDate(2026, 10, 5));

      // Checked today: still listed, as checked.
      await valueWhere(
        container,
        homeHabitsProvider,
        (habits) => habits.length == 1 && habits.single.checkedToday,
      );

      now = DateTime(2026, 10, 6, 7);
      container.read(todayProvider.notifier).refresh();
      await valueWhere(
        container,
        homeHabitsProvider,
        (habits) => habits.isEmpty,
      );
    },
  );

  test('a project activated in the repository appears on Home', () async {
    final p = await r.projects.create(
      title: 'Garden',
      status: ProjectStatus.backlog,
    );
    await valueWhere(container, homeProjectsProvider, (list) => list.isEmpty);

    await r.projects.setStatus(p.id, ProjectStatus.active);
    final projects = await valueWhere(
      container,
      homeProjectsProvider,
      (list) => list.isNotEmpty,
    );
    expect(projects.single.project.title, 'Garden');
  });

  test('projects are ordered by score and carry their next step', () async {
    await r.projects.create(title: 'Calm', importance: 5);
    await r.projects.create(
      title: 'Urgent',
      importance: 2,
      deadline: CalendarDate(2026, 10, 4),
      nextStep: 'Call',
    );

    final projects = await valueWhere(
      container,
      homeProjectsProvider,
      (list) => list.length == 2,
    );
    expect(projects.map((p) => p.project.title), ['Urgent', 'Calm']);
    expect(projects.first.nextStep!.title, 'Call');
    expect(projects.last.nextStep, isNull);
  });

  test('upcoming deadlines use today from the provider', () async {
    final p = await r.projects.create(title: 'Thesis');
    await r.tasks.create(
      projectId: p.id,
      title: 'Submit',
      dueDate: CalendarDate(2026, 10, 13),
    );
    // 8 days away: not yet listed.
    await valueWhere(container, upcomingDeadlinesProvider, (l) => l.isEmpty);

    now = DateTime(2026, 10, 6, 9);
    container.read(todayProvider.notifier).refresh();
    final items = await valueWhere(
      container,
      upcomingDeadlinesProvider,
      (l) => l.isNotEmpty,
    );
    expect(items.single.title, 'Submit');
  });

  test('Home tasks: outside projects, overdue first, none last', () async {
    final p = await r.projects.create(title: 'Thesis');
    await r.tasks.create(title: 'A');
    await r.tasks.create(title: 'B', dueDate: CalendarDate(2026, 10, 6));
    final o = await r.objective();
    final kr = await r.numericKr(o.id, title: 'Run 100 km');
    await r.tasks.create(
      title: 'C',
      dueDate: CalendarDate(2026, 10, 1),
      assignment: ForKeyResult(kr.id),
    );
    await r.tasks.create(projectId: p.id, title: 'In project');

    final tasks = await valueWhere(
      container,
      homeTasksProvider,
      (list) => list.length == 3,
    );
    expect(tasks.map((t) => t.task.title), ['C', 'B', 'A']);
    expect(tasks.first.assignedTo, 'Run 100 km');
    expect(tasks.last.assignedTo, isNull);
  });

  test('today progress: habits done of due and tasks due', () async {
    final habit = await r.habits.create(
      title: 'Stretch',
      scheduleType: ScheduleType.daily,
    );
    await r.habits.create(title: 'Read', scheduleType: ScheduleType.daily);
    await r.habitChecks.check(habit, CalendarDate(2026, 10, 5));
    await r.tasks.create(
      title: 'Due today',
      dueDate: CalendarDate(2026, 10, 5),
    );
    await r.tasks.create(title: 'Overdue', dueDate: CalendarDate(2026, 10, 1));
    await r.tasks.create(title: 'Later', dueDate: CalendarDate(2026, 10, 9));

    final progress = await valueWhere(
      container,
      todayProgressProvider,
      (p) => p.habitsDue == 2 && p.tasksDue == 2,
    );
    expect(progress.habitsDone, 1);
  });
}
