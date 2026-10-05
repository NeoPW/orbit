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

  List<String> underKr(PlanOverview o) => [
    for (final objective in o.objectives)
      for (final kr in objective.keyResults)
        for (final p in kr.projects) p.project.title,
  ];

  test('planOverview emits again after a project status change', () async {
    final o = await r.objective();
    final kr = await r.numericKr(o.id);
    final p = await r.projects.create(title: 'Thesis', keyResultId: kr.id);

    await valueWhere(
      container,
      planOverviewProvider,
      (o) => underKr(o).contains('Thesis'),
    );

    await r.projects.setStatus(p.id, ProjectStatus.backlog);

    final after = await valueWhere(
      container,
      planOverviewProvider,
      (o) => underKr(o).isEmpty,
    );
    expect(after.objectives.single.keyResults.single.projects, isEmpty);
  });

  test(
    'archive lists completed objectives and projects, newest first',
    () async {
      final o = await r.objective(title: 'Old goal');
      final p = await r.projects.create(title: 'Done project');
      await r.objective(title: 'Still active');
      await r.projects.setStatus(p.id, ProjectStatus.completed);
      await r.objectives.update(o.copyWith(status: ObjectiveStatus.archived));

      final items = await valueWhere(
        container,
        archiveProvider,
        (items) => items.length == 2,
      );
      expect(items.first, isA<ArchivedObjective>());
      expect((items.first as ArchivedObjective).objective.title, 'Old goal');
      expect((items.last as ArchivedProject).project.title, 'Done project');
    },
  );

  test('checking the linked habit raises the habit KR progress', () async {
    final o = await r.objective();
    final habit = await r.habits.create(
      title: 'Run',
      scheduleType: ScheduleType.daily,
    );
    await r.keyResults.create(
      objectiveId: o.id,
      title: 'Run 20 times',
      measureType: MeasureType.habit,
      targetValue: 20,
      habitId: habit.id,
    );

    double progress(PlanOverview o) =>
        o.objectives.single.keyResults.single.progress;

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
