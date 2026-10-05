import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/features/projects/data/project_repository.dart';
import 'package:orbit/features/tasks/data/task_repository.dart';
import 'package:orbit/features/tasks/ui/task_tile.dart';

import '../../../helpers/pump_app.dart';
import '../../../helpers/seed.dart';
import '../../../helpers/test_db.dart';

/// The project's open tasks as tiles, live.
Widget taskList(String projectId) => Consumer(
  builder: (context, ref, _) {
    final project = ref.watch(projectProvider(projectId)).value;
    final tasks = ref.watch(projectOpenTasksProvider(projectId)).value;
    if (project == null || tasks == null) return const SizedBox();
    return ListView(
      children: [
        for (final task in tasks)
          TaskTile(task: task, isNextStep: task.id == project.nextStepTaskId),
      ],
    );
  },
);

Finder tileOf(String title) => find.widgetWithText(ListTile, title);

Finder markerIn(String title) =>
    find.descendant(of: tileOf(title), matching: find.text('Next step'));

void main() {
  late AppDatabase db;
  late Seed seed;
  setUp(() {
    db = newTestDatabase();
    seed = Seed(db);
  });

  testApp('marks the next step and shows the due date', (tester) async {
    final p = await seed.projects.create(title: 'Thesis', nextStep: 'Draft');
    await seed.tasks.create(
      projectId: p.id,
      title: 'Book venue',
      dueDate: CalendarDate(2026, 10, 20),
    );
    await pumpInScaffold(tester, taskList(p.id), db: db);

    expect(markerIn('Draft'), findsOneWidget);
    expect(markerIn('Book venue'), findsNothing);
    expect(find.text('Due 20-10-2026'), findsOneWidget);
  });

  testApp('"Make next step" moves the marker', (tester) async {
    final p = await seed.projects.create(title: 'Thesis', nextStep: 'Draft');
    await seed.tasks.create(projectId: p.id, title: 'Book venue');
    await pumpInScaffold(tester, taskList(p.id), db: db);

    await tester.tap(
      find.descendant(
        of: tileOf('Book venue'),
        matching: find.byTooltip('Task actions'),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Make next step'));
    await tester.pumpAndSettle();

    expect(markerIn('Book venue'), findsOneWidget);
    expect(markerIn('Draft'), findsNothing);
  });

  testApp('delete asks for confirmation and removes the task', (tester) async {
    final p = await seed.projects.create(title: 'Thesis');
    await seed.tasks.create(projectId: p.id, title: 'Book venue');
    await pumpInScaffold(tester, taskList(p.id), db: db);

    await tester.tap(find.byTooltip('Task actions'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Delete'));
    await tester.pumpAndSettle();
    expect(find.text('Delete task?'), findsOneWidget);
    await tester.tap(find.widgetWithText(FilledButton, 'Delete'));
    await tester.pumpAndSettle();

    expect(tileOf('Book venue'), findsNothing);
    final alive = await (db.select(
      db.tasks,
    )..where((t) => t.deletedAt.isNull())).get();
    expect(alive, isEmpty);
  });
}
