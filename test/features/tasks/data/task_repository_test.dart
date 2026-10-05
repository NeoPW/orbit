import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';

import '../../../helpers/repos.dart';

void main() {
  late Repos r;
  setUp(() => r = Repos());
  tearDown(() => r.close());

  test('create adds an open task', () async {
    final task = await r.tasks.create(projectId: 'p1', title: ' Draft ');
    expect(task.status, TaskStatus.open);
    expect(task.title, 'Draft');
    expect(task.projectId, 'p1');
    expect(task.dueDate, isNull);
  });

  test('create stores a due date', () async {
    final task = await r.tasks.create(
      projectId: 'p1',
      title: 'Book venue',
      dueDate: CalendarDate(2026, 10, 20),
    );
    expect(task.dueDate, CalendarDate(2026, 10, 20));
  });

  test('updateTitle renames and bumps updated_at', () async {
    final task = await r.tasks.create(projectId: 'p1', title: 'Draft');
    await r.tasks.updateTitle(task.id, 'Write intro');
    final stored = await r.tasks.get(task.id);
    expect(stored!.title, 'Write intro');
    expect(stored.updatedAt.isAfter(task.updatedAt), isTrue);
  });

  test('update saves title, notes and due date, including clearing', () async {
    final task = await r.tasks.create(
      projectId: 'p1',
      title: 'Draft',
      dueDate: CalendarDate(2026, 10, 20),
    );
    await r.tasks.update(
      task.copyWith(title: ' Outline ', notes: ' chapter 1 '),
    );
    var stored = (await r.tasks.get(task.id))!;
    expect(stored.title, 'Outline');
    expect(stored.notes, 'chapter 1');
    expect(stored.dueDate, CalendarDate(2026, 10, 20));

    await r.tasks.update(stored.copyWith(dueDate: const Value(null)));
    stored = (await r.tasks.get(task.id))!;
    expect(stored.dueDate, isNull);
  });

  test('open tasks: due date first, none last, then creation time', () async {
    await r.tasks.create(projectId: 'p1', title: 'A');
    await r.tasks.create(
      projectId: 'p1',
      title: 'B',
      dueDate: CalendarDate(2026, 10, 20),
    );
    await r.tasks.create(
      projectId: 'p1',
      title: 'C',
      dueDate: CalendarDate(2026, 10, 10),
    );
    await r.tasks.create(projectId: 'p1', title: 'D');
    await r.tasks.create(projectId: 'p2', title: 'Other project');

    final tasks = await r.tasks.watchOpenForProject('p1').first;
    expect(tasks.map((t) => t.title), ['C', 'B', 'A', 'D']);
  });

  test('watchOpenWithDueDate: open, dated tasks of active projects', () async {
    final active = await r.projects.create(title: 'Thesis');
    final paused = await r.projects.create(
      title: 'Garden',
      status: ProjectStatus.paused,
    );
    final due = CalendarDate(2026, 10, 6);
    await r.tasks.create(projectId: active.id, title: 'Due', dueDate: due);
    await r.tasks.create(projectId: active.id, title: 'No date');
    await r.tasks.create(projectId: paused.id, title: 'Paused', dueDate: due);
    final done = await r.tasks.create(
      projectId: active.id,
      title: 'Done',
      dueDate: due,
    );
    await r.tasks.complete(done.id);

    final tasks = await r.tasks.watchOpenWithDueDate().first;
    expect(tasks.map((t) => t.task.title), ['Due']);
    expect(tasks.single.project.title, 'Thesis');
  });

  test('deleteForProject soft-deletes only that project\'s tasks', () async {
    final a = await r.tasks.create(projectId: 'p1', title: 'A');
    final b = await r.tasks.create(projectId: 'p2', title: 'B');
    await r.tasks.deleteForProject('p1');
    expect(await r.tasks.get(a.id), isNull);
    expect((await r.rawTask(a.id)).deletedAt, isNotNull);
    expect(await r.tasks.get(b.id), isNotNull);
  });

  group('complete', () {
    test('marks the task done and logs it', () async {
      final task = await r.tasks.create(projectId: 'p1', title: 'Book venue');
      final logEntryId = await r.tasks.complete(task.id);

      final stored = await r.rawTask(task.id);
      expect(stored.status, TaskStatus.done);
      expect(stored.completedAt, isNotNull);
      expect(await r.tasks.watchOpenForProject('p1').first, isEmpty);

      final entry = await r.rawLogEntry(logEntryId);
      expect(entry.source, LogSource.task);
      expect(entry.projectId, 'p1');
      expect(entry.note, 'Book venue');
      expect(entry.durationMinutes, isNull);
    });

    test('undo reopens the task and removes its log entry', () async {
      final task = await r.tasks.create(projectId: 'p1', title: 'Book venue');
      final logEntryId = await r.tasks.complete(task.id);
      await r.tasks.undoComplete(task.id, logEntryId);

      final stored = await r.rawTask(task.id);
      expect(stored.status, TaskStatus.open);
      expect(stored.completedAt, isNull);
      expect(await r.logs.watchForProject('p1').first, isEmpty);
    });
  });

  group('delete', () {
    test('deleting the next-step task clears the next step', () async {
      final p = await r.projects.create(title: 'Thesis', nextStep: 'Draft');
      await r.tasks.delete(p.nextStepTaskId!);

      expect(await r.tasks.get(p.nextStepTaskId!), isNull);
      expect((await r.projects.get(p.id))!.nextStepTaskId, isNull);
    });

    test('log entries of a completed task remain', () async {
      final task = await r.tasks.create(projectId: 'p1', title: 'Draft');
      await r.tasks.complete(task.id);
      await r.tasks.delete(task.id);

      expect(await r.logs.watchForProject('p1').first, hasLength(1));
    });

    test('other projects keep their next step', () async {
      final a = await r.projects.create(title: 'A', nextStep: 'Step A');
      final b = await r.projects.create(title: 'B', nextStep: 'Step B');
      await r.tasks.delete(a.nextStepTaskId!);

      expect((await r.projects.get(b.id))!.nextStepTaskId, b.nextStepTaskId);
    });
  });
}
