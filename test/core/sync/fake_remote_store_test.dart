import 'package:flutter_test/flutter_test.dart';

import '../../helpers/fake_remote_store.dart';

Map<String, Object?> row(String id, String updatedAt, String title) => {
  'id': id,
  'updated_at': updatedAt,
  'title': title,
};

void main() {
  test('an older update is ignored, a newer one stored', () async {
    final remote = FakeRemoteStore();
    await remote.upsert('projects', [
      row('p1', '2026-10-05T10:05:00.000Z', 'B'),
    ]);
    await remote.upsert('projects', [
      row('p1', '2026-10-05T10:00:00.000Z', 'A'),
    ]);
    expect(remote.rows('projects').single['title'], 'B');

    await remote.upsert('projects', [
      row('p1', '2026-10-05T10:10:00.000Z', 'C'),
    ]);
    expect(remote.rows('projects').single['title'], 'C');
  });

  test('changedSince returns rows by server time, oldest first', () async {
    final remote = FakeRemoteStore();
    await remote.upsert('projects', [row('a', '2026-10-05T10:00:00Z', 'A')]);
    final after = DateTime.parse(
      remote.rows('projects').single['server_updated_at']! as String,
    );
    await remote.upsert('projects', [row('b', '2026-10-05T09:00:00Z', 'B')]);
    await remote.upsert('projects', [row('c', '2026-10-05T08:00:00Z', 'C')]);

    final changed = await remote.changedSince(
      'projects',
      after,
      limit: 10,
      offset: 0,
    );
    expect(changed.map((r) => r['id']), ['b', 'c']);
    expect(await remote.hasAnyData(), isTrue);
    expect(await FakeRemoteStore().hasAnyData(), isFalse);
  });
}
