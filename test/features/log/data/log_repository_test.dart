import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';

import 'package:orbit/features/log/data/log_repository.dart';

import '../../../helpers/repos.dart';
import '../../../helpers/test_db.dart';

void main() {
  late Repos r;
  setUp(() => r = Repos());
  tearDown(() => r.close());

  test('createManual logs work on a project at the current time', () async {
    final entry = await r.logs.createManual(
      projectId: 'p1',
      durationMinutes: 45,
      note: ' Chapter 2 ',
    );
    expect(entry.projectId, 'p1');
    expect(entry.keyResultId, isNull);
    expect(entry.durationMinutes, 45);
    expect(entry.note, 'Chapter 2');
    expect(entry.source, LogSource.manual);
    expect(entry.occurredAt, entry.createdAt);
    expect(entry.occurredAt.isUtc, isTrue);
  });

  test('watchForProject lists only that project, newest first', () async {
    final first = await r.logs.createManual(projectId: 'p1');
    await r.logs.createManual(projectId: 'p2');
    final second = await r.logs.createManual(projectId: 'p1');

    final entries = await r.logs.watchForProject('p1').first;
    expect(entries.map((e) => e.id), [second.id, first.id]);
  });

  test('watchLastLoggedAt maps each project to its latest entry', () async {
    await r.logs.createManual(projectId: 'p1');
    final latest = await r.logs.createManual(projectId: 'p1');
    final other = await r.logs.createManual(projectId: 'p2');
    await r.logs.add(note: 'no project', source: LogSource.manual);

    final map = await r.logs.watchLastLoggedAt().first;
    expect(map, {'p1': latest.occurredAt, 'p2': other.occurredAt});
  });

  test('deleted entries are not emitted', () async {
    final kept = await r.logs.createManual(projectId: 'p1');
    final deleted = await r.logs.createManual(projectId: 'p1');
    await r.logs.delete(deleted.id);

    final entries = await r.logs.watchForProject('p1').first;
    expect(entries.map((e) => e.id), [kept.id]);
    expect((await r.rawLogEntry(deleted.id)).deletedAt, isNotNull);
    expect(await r.logs.watchLastLoggedAt().first, {'p1': kept.occurredAt});
  });

  test('watchBetween includes the start and excludes the end', () async {
    final from = DateTime.utc(2026, 10, 4, 22);
    final to = DateTime.utc(2026, 10, 11, 22);
    final ids = TestIds();
    Future<LogEntry> at(DateTime time) => LogRepository(
      r.db,
      TestClock(time).call,
      () => 'log-${ids()}',
    ).createManual(projectId: 'p1', note: time.toIso8601String());

    await at(from.subtract(const Duration(seconds: 1)));
    final first = await at(from);
    final last = await at(to.subtract(const Duration(seconds: 1)));
    await at(to);

    final entries = await r.logs.watchBetween(from, to).first;
    expect(entries.map((e) => e.note).toSet(), {first.note, last.note});
  });

  test('manual entries on a task and the last-logged time per task', () async {
    final entry = await r.logs.createManual(taskId: 't1', durationMinutes: 30);
    expect(entry.taskId, 't1');
    expect(entry.projectId, isNull);
    expect((await r.logs.watchForTask('t1').first).map((e) => e.id), [
      entry.id,
    ]);
    expect(await r.logs.watchLastLoggedAtTasks().first, {
      't1': entry.occurredAt,
    });
  });
}
