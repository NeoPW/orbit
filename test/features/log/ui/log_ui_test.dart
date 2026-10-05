import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/router/routes.dart';

import '../../../helpers/pump_app.dart';
import '../../../helpers/seed.dart';
import '../../../helpers/test_db.dart';

void main() {
  late AppDatabase db;
  late Seed seed;
  setUp(() {
    db = newTestDatabase();
    seed = Seed(db);
  });

  Future<List<LogEntry>> entries() =>
      (db.select(db.logEntries)..where((e) => e.deletedAt.isNull())).get();

  Future<void> scrollTo(WidgetTester tester, Finder finder) =>
      tester.scrollUntilVisible(finder, 100);

  group('log section in project detail', () {
    testApp('empty log says so', (tester) async {
      final p = await seed.projects.create(title: 'Thesis');
      await pumpApp(tester, db: db, location: Routes.projectDetail(p.id));
      await scrollTo(tester, find.text('Nothing logged yet'));
      expect(find.text('Nothing logged yet'), findsOneWidget);
    });

    testApp('shows note, duration and source', (tester) async {
      final p = await seed.projects.create(title: 'Thesis');
      await seed.logs.createManual(
        projectId: p.id,
        durationMinutes: 90,
        note: 'Chapter 2',
      );
      await pumpApp(tester, db: db, location: Routes.projectDetail(p.id));
      await scrollTo(tester, find.text('Chapter 2'));

      expect(find.textContaining('1 h 30 min · Manual'), findsOneWidget);
      expect(
        find.textContaining(RegExp(r'\d\d-\d\d-\d{4} \d\d:\d\d')),
        findsOneWidget,
      );
    });

    testApp('deleting a habit entry unchecks the habit', (tester) async {
      final p = await seed.projects.create(title: 'Marathon');
      final habit = await seed.habits.create(
        title: 'Run',
        projectId: p.id,
        scheduleType: ScheduleType.daily,
      );
      final today = CalendarDate.today(() => DateTime.now().toUtc());
      await seed.habitChecks.check(habit, today);
      await pumpApp(
        tester,
        db: db,
        location: Routes.projectDetail(p.id),
        height: 1600,
      );
      await tester.tap(find.byTooltip('Delete log entry'));
      await tester.pumpAndSettle();
      expect(
        find.text('This also unchecks the habit for that day.'),
        findsOneWidget,
      );
      await tester.tap(find.widgetWithText(FilledButton, 'Delete'));
      await tester.pumpAndSettle();

      expect(await entries(), isEmpty);
      final checks = await (db.select(
        db.habitChecks,
      )..where((c) => c.deletedAt.isNull())).get();
      expect(checks, isEmpty);
    });
  });

  group('log work from detail', () {
    testApp('saves a manual entry listed first', (tester) async {
      final p = await seed.projects.create(title: 'Thesis');
      await seed.logs.createManual(projectId: p.id, note: 'Older');
      await pumpApp(tester, db: db, location: Routes.projectDetail(p.id));
      await scrollTo(tester, find.text('Log work'));
      await tester.tap(find.text('Log work'));
      await tester.pumpAndSettle();
      await tester.enterText(
        find.widgetWithText(TextField, 'Minutes (optional)'),
        '30',
      );
      await tester.enterText(
        find.widgetWithText(TextField, 'Note (optional)'),
        'Outline',
      );
      await tester.tap(find.text('Save'));
      await tester.pumpAndSettle();

      final newest = (await entries()).firstWhere((e) => e.note == 'Outline');
      expect(newest.durationMinutes, 30);
      expect(newest.source, LogSource.manual);
      expect(newest.projectId, p.id);
      final titles = tester
          .widgetList<ListTile>(find.byType(ListTile))
          .map((t) => t.title)
          .whereType<Text>()
          .map((t) => t.data)
          .toList();
      expect(titles.indexOf('Outline'), lessThan(titles.indexOf('Older')));
    });

    testApp('an invalid duration is not saved', (tester) async {
      final p = await seed.projects.create(title: 'Thesis');
      await pumpApp(tester, db: db, location: Routes.projectDetail(p.id));
      await scrollTo(tester, find.text('Log work'));
      await tester.tap(find.text('Log work'));
      await tester.pumpAndSettle();
      await tester.enterText(
        find.widgetWithText(TextField, 'Minutes (optional)'),
        '0',
      );
      await tester.tap(find.text('Save'));
      await tester.pumpAndSettle();

      expect(find.text('Enter 1 to 1440 minutes'), findsOneWidget);
      expect(await entries(), isEmpty);
    });
  });
}
