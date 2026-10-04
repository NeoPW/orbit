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
  });

  test('updateTitle renames and bumps updated_at', () async {
    final task = await r.tasks.create(projectId: 'p1', title: 'Draft');
    await r.tasks.updateTitle(task.id, 'Write intro');
    final stored = await r.tasks.get(task.id);
    expect(stored!.title, 'Write intro');
    expect(stored.updatedAt.isAfter(task.updatedAt), isTrue);
  });

  test('deleteForProject soft-deletes only that project\'s tasks', () async {
    final a = await r.tasks.create(projectId: 'p1', title: 'A');
    final b = await r.tasks.create(projectId: 'p2', title: 'B');
    await r.tasks.deleteForProject('p1');
    expect(await r.tasks.get(a.id), isNull);
    expect((await r.rawTask(a.id)).deletedAt, isNotNull);
    expect(await r.tasks.get(b.id), isNotNull);
  });
}
