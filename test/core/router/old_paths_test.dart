import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/router/router.dart';
import 'package:orbit/core/router/routes.dart';
import 'package:orbit/features/key_results/ui/key_result_screen.dart';
import 'package:orbit/features/objectives/ui/objective_screen.dart';
import 'package:orbit/features/projects/ui/project_detail_screen.dart';

import '../../helpers/pump_app.dart';
import '../../helpers/seed.dart';
import '../../helpers/test_db.dart';

void main() {
  group('redirectOldPath', () {
    for (final (from, to) in [
      ('/', Routes.home),
      ('/plan/objectives/new', Routes.plan),
      ('/plan/objectives/o1', Routes.objective('o1')),
      ('/plan/objectives/o1/key-results/new', Routes.plan),
      ('/plan/key-results/k1', Routes.keyResult('k1')),
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
      Routes.keyResult('k1'),
      Routes.task('t1'),
    ]) {
      test('$path stays', () => expect(redirectOldPath(path), isNull));
    }
  });

  group('opening an old URL', () {
    testApp('the former KR form URL shows the KR page', (tester) async {
      final db = newTestDatabase();
      final seed = Seed(db);
      final kr = await seed.kr((await seed.objective()).id);
      final app = await pumpApp(
        tester,
        db: db,
        location: '/plan/key-results/${kr.id}',
      );
      expect(find.byType(KeyResultPageBody), findsOneWidget);
      expect(app.router.state.uri.path, Routes.keyResult(kr.id));
    });

    testApp('the former objective form URL shows the objective page', (
      tester,
    ) async {
      final db = newTestDatabase();
      final o = await Seed(db).objective();
      await pumpApp(tester, db: db, location: '/plan/objectives/${o.id}');
      expect(find.byType(ObjectivePageBody), findsOneWidget);
    });

    testApp('the former project form URL shows the project detail', (
      tester,
    ) async {
      final db = newTestDatabase();
      final p = await Seed(db).projects.create(title: 'Thesis');
      await pumpApp(tester, db: db, location: '/plan/projects/${p.id}');
      expect(find.byType(ProjectDetailBody), findsOneWidget);
    });
  });
}
