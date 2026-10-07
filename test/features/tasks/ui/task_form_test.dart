import 'package:drift/drift.dart' hide isNull, isNotNull, Column;
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/features/tasks/data/task_repository.dart';
import 'package:orbit/features/tasks/domain/task_assignment.dart';
import 'package:orbit/features/tasks/ui/task_form.dart';

import '../../../helpers/pump_app.dart';
import '../../../helpers/seed.dart';
import '../../../helpers/test_db.dart';

Widget opener({Task? task}) => Builder(
  builder: (context) => TextButton(
    onPressed: () => showTaskForm(context, projectId: 'p1', task: task),
    child: const Text('open'),
  ),
);

Future<List<Task>> openTasksOf(AppDatabase db) => (db.select(
  db.tasks,
)..where((t) => t.projectId.equals('p1') & t.deletedAt.isNull())).get();

void main() {
  // Created outside the test body so its queries run outside fake async.
  late AppDatabase db;
  setUp(() => db = newTestDatabase());

  Future<List<Task>> openTasks() => openTasksOf(db);

  testApp('adding without a title shows an error and saves nothing', (
    tester,
  ) async {
    await pumpInScaffold(tester, opener(), db: db);
    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();
    await tester.enterText(find.widgetWithText(TextField, 'Title'), '  ');
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    expect(find.text('Enter a title'), findsOneWidget);
    expect(await openTasks(), isEmpty);
  });

  testApp('adds a task with title and notes', (tester) async {
    await pumpInScaffold(tester, opener(), db: db);
    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.widgetWithText(TextField, 'Title'),
      'Book venue',
    );
    await tester.enterText(
      find.widgetWithText(TextField, 'Notes (optional)'),
      'Call',
    );
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    final task = (await openTasks()).single;
    expect(task.title, 'Book venue');
    expect(task.notes, 'Call');
    expect(find.text('New task'), findsNothing);
  });

  testApp('editing saves a picked due date shown as dd-mm-yyyy', (
    tester,
  ) async {
    final task = await TaskRepository(db, TestClock().call, TestIds().call)
        .create(
          projectId: 'p1',
          title: 'Book venue',
          dueDate: CalendarDate(2026, 11, 1),
        );
    await pumpInScaffold(tester, opener(task: task), db: db);
    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();
    expect(find.text('01-11-2026'), findsOneWidget);

    await tester.tap(find.text('01-11-2026'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('15'));
    await tester.tap(find.text('OK'));
    await tester.pumpAndSettle();
    expect(find.text('15-11-2026'), findsOneWidget);

    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();
    expect((await openTasks()).single.dueDate, CalendarDate(2026, 11, 15));
  });

  testApp('a new task can be assigned to a key result', (tester) async {
    final seed = Seed(db);
    final o = await seed.objective();
    final kr = await seed.kr(o.id, title: 'Run 100 km');
    await pumpInScaffold(tester, opener(), db: db);
    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.widgetWithText(TextField, 'Title'),
      'Book physio',
    );
    await tester.tap(find.byType(DropdownButtonFormField<TaskAssignment>));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Key result · Run 100 km').last);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    final task = await (db.select(
      db.tasks,
    )..where((t) => t.title.equals('Book physio'))).getSingle();
    expect(task.keyResultId, kr.id);
    expect(task.projectId, isNull);
  });

  testApp('the assignment can be cleared', (tester) async {
    final task = await TaskRepository(
      db,
      TestClock().call,
      TestIds().call,
    ).create(projectId: 'p1', title: 'Draft');
    await pumpInScaffold(tester, opener(task: task), db: db);
    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();
    await tester.tap(find.byType(DropdownButtonFormField<TaskAssignment>));
    await tester.pumpAndSettle();
    await tester.tap(find.text('No assignment').last);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    final stored = await (db.select(
      db.tasks,
    )..where((t) => t.id.equals(task.id))).getSingle();
    expect(stored.projectId, isNull);
  });
}
