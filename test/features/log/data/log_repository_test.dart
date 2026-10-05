import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';

import '../../../helpers/repos.dart';

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
}
