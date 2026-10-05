import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/features/tasks/ui/complete_task.dart';

import '../../../helpers/pump_app.dart';
import '../../../helpers/seed.dart';
import '../../../helpers/test_db.dart';

Widget completer(Task task, {bool isNextStep = false}) => Consumer(
  builder: (context, ref, _) => TextButton(
    onPressed: () => completeTask(context, ref, task, isNextStep: isNextStep),
    child: const Text('complete'),
  ),
);

void main() {
  late AppDatabase db;
  late Seed seed;
  setUp(() {
    db = newTestDatabase();
    seed = Seed(db);
  });

  Future<Task> rawTask(String id) =>
      (db.select(db.tasks)..where((t) => t.id.equals(id))).getSingle();
  Future<List<LogEntry>> logEntries() =>
      (db.select(db.logEntries)..where((e) => e.deletedAt.isNull())).get();

  testApp('completing shows a snackbar; Undo reopens the task', (tester) async {
    final p = await seed.projects.create(title: 'Thesis');
    final task = await seed.tasks.create(projectId: p.id, title: 'Book venue');
    await pumpInScaffold(tester, completer(task), db: db);

    await tester.tap(find.text('complete'));
    await tester.pumpAndSettle();
    expect(find.text('Task completed'), findsOneWidget);
    expect((await rawTask(task.id)).status, TaskStatus.done);
    expect(await logEntries(), hasLength(1));

    await tester.tap(find.text('Undo'));
    await tester.pumpAndSettle();
    expect((await rawTask(task.id)).status, TaskStatus.open);
    expect(await logEntries(), isEmpty);
  });

  testApp('the next step asks first; cancel changes nothing', (tester) async {
    final p = await seed.projects.create(title: 'Thesis', nextStep: 'Draft');
    final task = await rawTask(p.nextStepTaskId!);
    await pumpInScaffold(tester, completer(task, isNextStep: true), db: db);

    await tester.tap(find.text('complete'));
    await tester.pumpAndSettle();
    expect(find.text("What's the next step?"), findsOneWidget);
    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();

    expect((await rawTask(task.id)).status, TaskStatus.open);
    expect((await seed.projects.get(p.id))!.nextStepTaskId, task.id);
    expect(await logEntries(), isEmpty);
    expect(find.text('Task completed'), findsNothing);
  });

  testApp('the next step with skip completes it and clears the link', (
    tester,
  ) async {
    final p = await seed.projects.create(title: 'Thesis', nextStep: 'Draft');
    final task = await rawTask(p.nextStepTaskId!);
    await pumpInScaffold(tester, completer(task, isNextStep: true), db: db);

    await tester.tap(find.text('complete'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();

    expect((await rawTask(task.id)).status, TaskStatus.done);
    expect((await seed.projects.get(p.id))!.nextStepTaskId, isNull);
    expect(find.text('Task completed'), findsOneWidget);
  });
}
