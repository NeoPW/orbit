import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/router/router.dart';
import 'package:orbit/core/router/routes.dart';
import 'package:orbit/features/goals/ui/goal_screen.dart';

import '../../helpers/pump_app.dart';
import '../../helpers/seed.dart';
import '../../helpers/test_db.dart';

void main() {
  group('redirectOldPath', () {
    for (final (from, to) in [
      ('/', Routes.home),
      ('/plan/objectives/new', Routes.plan),
      ('/plan/objectives/o1', Routes.goal('o1')),
      ('/plan/objectives/o1/key-results/new', Routes.plan),
      ('/plan/key-results/k1', '/key-results/k1'),
      ('/objectives/o1', Routes.goal('o1')),
      ('/plan/projects/new', Routes.plan),
      ('/plan/projects/p1', Routes.projectDetail('p1')),
      ('/plan/habits/new', Routes.habits),
      ('/plan/habits/h1', Routes.habits),
    ]) {
      test('$from leads to $to', () => expect(redirectOldPath(from), to));
    }

    for (final path in [
      Routes.plan,
      Routes.habits,
      Routes.archive,
      Routes.goal('g1'),
      '/key-results/k1',
      Routes.task('t1'),
    ]) {
      test('$path stays', () => expect(redirectOldPath(path), isNull));
    }
  });

  group('opening an old URL', () {
    testApp('an old objective link shows the goal page', (tester) async {
      final db = newTestDatabase();
      final g = await Seed(db).goal(title: 'Get fit');
      final app = await pumpApp(
        tester,
        db: db,
        location: '/objectives/${g.id}',
      );
      expect(find.byType(GoalPageBody), findsOneWidget);
      expect(find.text('Get fit'), findsWidgets);
      expect(app.router.state.uri.path, Routes.goal(g.id));
    });

    testApp('an old key result link shows its goal', (tester) async {
      final db = newTestDatabase();
      final seed = Seed(db);
      final g = await seed.goal(title: 'Get fit');
      final m = await seed.measure(g.id, title: 'Run 100 km');
      await pumpApp(tester, db: db, location: '/key-results/${m.id}');
      expect(find.byType(GoalPageBody), findsOneWidget);
      expect(find.text('Run 100 km'), findsOneWidget);
    });

    testApp('an unknown key result says the goal was not found', (
      tester,
    ) async {
      await pumpApp(tester, location: '/key-results/gone');
      expect(find.text('Goal not found'), findsOneWidget);
    });
  });
}
