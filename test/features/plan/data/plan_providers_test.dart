import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/features/plan/data/plan_providers.dart';
import 'package:orbit/features/plan/domain/plan_overview.dart';

import '../../../helpers/provider_container.dart';
import '../../../helpers/repos.dart';

void main() {
  late Repos r;
  late ProviderContainer container;
  setUp(() {
    r = Repos();
    container = containerWith(r.db);
  });
  tearDown(() async {
    container.dispose();
    await r.close();
  });

  List<String> underGoals(PlanOverview o) => [
    for (final goal in o.goals)
      for (final p in goal.projects) p.project.title,
  ];

  test('planOverview emits again after a project status change', () async {
    final g = await r.goal();
    final p = await r.projects.create(title: 'Thesis', goalId: g.id);

    await valueWhere(
      container,
      planOverviewProvider,
      (o) => underGoals(o).contains('Thesis'),
    );

    await r.projects.setStatus(p.id, ProjectStatus.backlog);

    final after = await valueWhere(
      container,
      planOverviewProvider,
      (o) => underGoals(o).isEmpty,
    );
    expect(after.goals.single.projects, isEmpty);
  });

  test('archive lists completed goals and projects, newest first', () async {
    final g = await r.goal(title: 'Old goal');
    final p = await r.projects.create(title: 'Done project');
    await r.goal(title: 'Still active');
    await r.projects.setStatus(p.id, ProjectStatus.completed);
    await r.goals.update(g.copyWith(status: GoalStatus.archived));

    final items = await valueWhere(
      container,
      archiveProvider,
      (items) => items.length == 2,
    );
    expect(items.first, isA<ArchivedGoal>());
    expect((items.first as ArchivedGoal).goal.title, 'Old goal');
    expect((items.last as ArchivedProject).project.title, 'Done project');
  });

  test('checking the linked habit raises the habit measure progress', () async {
    final g = await r.goal();
    final habit = await r.habits.create(
      title: 'Run',
      scheduleType: ScheduleType.daily,
    );
    await r.measures.create(
      goalId: g.id,
      title: 'Run 20 times',
      measureType: MeasureType.habit,
      targetValue: 20,
      habitId: habit.id,
    );

    double progress(PlanOverview o) => o.goals.single.measures.single.progress;

    await valueWhere(container, planOverviewProvider, (o) => progress(o) == 0);
    await r.habitChecks.check(habit, CalendarDate(2026, 10, 5));
    final after = await valueWhere(
      container,
      planOverviewProvider,
      (o) => progress(o) > 0,
    );
    expect(progress(after), 0.05);
  });
}
