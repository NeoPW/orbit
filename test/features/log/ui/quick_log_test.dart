import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/features/log/data/log_repository.dart';
import 'package:orbit/features/log/ui/quick_log_sheet.dart';

import '../../../helpers/pump_app.dart';
import '../../../helpers/seed.dart';
import '../../../helpers/test_db.dart';

final opener = Builder(
  builder: (context) => TextButton(
    onPressed: () => showQuickLog(context),
    child: const Text('quick log'),
  ),
);

void main() {
  late AppDatabase db;
  late Seed seed;
  setUp(() {
    db = newTestDatabase();
    seed = Seed(db);
  });

  Future<List<LogEntry>> entries() =>
      (db.select(db.logEntries)..where((e) => e.deletedAt.isNull())).get();

  Future<void> open(WidgetTester tester) async {
    await pumpInScaffold(tester, opener, db: db);
    await tester.tap(find.text('quick log'));
    await tester.pumpAndSettle();
  }

  List<String?> listedProjects(WidgetTester tester) => tester
      .widgetList<ListTile>(find.byType(ListTile))
      .map((t) => (t.title as Text).data)
      .toList();

  testApp('two taps: open and choose a project', (tester) async {
    final p = await seed.projects.create(title: 'Thesis');
    await open(tester);
    await tester.tap(find.text('Thesis'));
    await tester.pumpAndSettle();

    final entry = (await entries()).single;
    expect(entry.projectId, p.id);
    expect(entry.source, LogSource.manual);
    expect(entry.durationMinutes, isNull);
    expect(find.text('Choose what you worked on'), findsNothing);
    expect(find.text('Logged work on Thesis'), findsOneWidget);
  });

  testApp('saves the entered duration and note', (tester) async {
    await seed.projects.create(title: 'Thesis');
    await open(tester);
    await tester.enterText(
      find.widgetWithText(TextField, 'Minutes (optional)'),
      '45',
    );
    await tester.enterText(
      find.widgetWithText(TextField, 'Note (optional)'),
      'Chapter 2',
    );
    await tester.tap(find.text('Thesis'));
    await tester.pumpAndSettle();

    final entry = (await entries()).single;
    expect(entry.durationMinutes, 45);
    expect(entry.note, 'Chapter 2');
  });

  testApp('an invalid duration shows an error and saves nothing', (
    tester,
  ) async {
    await seed.projects.create(title: 'Thesis');
    await open(tester);
    await tester.enterText(
      find.widgetWithText(TextField, 'Minutes (optional)'),
      '0',
    );
    await tester.tap(find.text('Thesis'));
    await tester.pumpAndSettle();

    expect(find.text('Enter 1 to 1440 minutes'), findsOneWidget);
    expect(await entries(), isEmpty);
  });

  testApp('lists only active projects, recently logged first', (tester) async {
    final a = await seed.projects.create(title: 'A');
    final b = await seed.projects.create(title: 'B');
    await seed.projects.create(title: 'C');
    await seed.projects.create(title: 'Paused', status: ProjectStatus.paused);
    // Distinct times: B is logged after A.
    final logs = LogRepository(db, TestClock().call, TestIds().call);
    await logs.createManual(projectId: a.id);
    await logs.createManual(projectId: b.id);
    await open(tester);

    expect(listedProjects(tester), ['B', 'A', 'C']);
  });

  testApp('without active projects says so', (tester) async {
    await open(tester);
    expect(find.text('There is nothing to log work on yet.'), findsOneWidget);
  });

  testApp('logging on a standalone task', (tester) async {
    final task = await seed.tasks.create(title: 'Tax return');
    await seed.projects.create(title: 'Thesis');
    await open(tester);
    expect(find.text('Projects'), findsOneWidget);
    expect(find.text('Tasks'), findsOneWidget);
    await tester.tap(find.text('Tax return'));
    await tester.pumpAndSettle();

    final entry = (await entries()).single;
    expect(entry.taskId, task.id);
    expect(entry.projectId, isNull);
    expect(find.text('Logged work on Tax return'), findsOneWidget);
  });
}
