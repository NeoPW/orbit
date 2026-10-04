import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/features/projects/data/area_filter.dart';

import '../../../helpers/repos.dart';

void main() {
  late Repos r;
  setUp(() => r = Repos());
  tearDown(() => r.close());

  test('create uses defaults: active, importance 3, no next step', () async {
    final p = await r.projects.create(title: ' Thesis ');
    expect(p.title, 'Thesis');
    expect(p.status, ProjectStatus.active);
    expect(p.importance, 3);
    expect(p.nextStepTaskId, isNull);
  });

  group('next step', () {
    test(
      'setting the first next step creates and links an open task',
      () async {
        final p = await r.projects.create(
          title: 'Thesis',
          nextStep: 'Draft outline',
        );
        final task = await r.projects.nextStep(p);
        expect(task!.title, 'Draft outline');
        expect(task.status, TaskStatus.open);
        expect(task.projectId, p.id);
        expect(p.nextStepTaskId, task.id);
      },
    );

    test('setting it on save creates the task', () async {
      final p = await r.projects.create(title: 'Thesis');
      final saved = await r.projects.save(p, nextStep: 'Draft outline');
      expect((await r.projects.nextStep(saved))!.title, 'Draft outline');
      expect((await r.projects.get(p.id))!.nextStepTaskId, isNotNull);
    });

    test('changing the text renames the same task', () async {
      final p = await r.projects.create(
        title: 'Thesis',
        nextStep: 'Draft outline',
      );
      final saved = await r.projects.save(p, nextStep: 'Write intro');
      expect(saved.nextStepTaskId, p.nextStepTaskId);
      expect((await r.projects.nextStep(saved))!.title, 'Write intro');
      expect(await r.db.select(r.db.tasks).get(), hasLength(1));
    });

    test('clearing unlinks and leaves the task open', () async {
      final p = await r.projects.create(
        title: 'Thesis',
        nextStep: 'Draft outline',
      );
      final saved = await r.projects.save(p, nextStep: '  ');
      expect(saved.nextStepTaskId, isNull);
      expect((await r.projects.get(p.id))!.nextStepTaskId, isNull);
      final task = await r.rawTask(p.nextStepTaskId!);
      expect(task.status, TaskStatus.open);
      expect(task.deletedAt, isNull);
    });
  });

  test('save persists all fields and bumps updated_at', () async {
    final p = await r.projects.create(title: 'Thesis');
    await r.projects.save(
      p.copyWith(
        importance: 5,
        status: ProjectStatus.paused,
        deadline: Value(CalendarDate(2026, 12, 1)),
      ),
      nextStep: '',
    );
    final stored = await r.projects.get(p.id);
    expect(stored!.importance, 5);
    expect(stored.status, ProjectStatus.paused);
    expect(stored.deadline, CalendarDate(2026, 12, 1));
    expect(stored.updatedAt.isAfter(p.updatedAt), isTrue);
  });

  test('watchByStatus orders by importance, then title', () async {
    await r.projects.create(title: 'b', importance: 3);
    await r.projects.create(title: 'A', importance: 3);
    await r.projects.create(title: 'C', importance: 5);
    await r.projects.create(title: 'D', status: ProjectStatus.backlog);
    final active = await r.projects.watchByStatus({ProjectStatus.active}).first;
    expect(active.map((p) => p.title), ['C', 'A', 'b']);
  });

  group('backlog', () {
    late String uni;
    setUp(() async {
      uni = (await r.areas.watchAll().first)
          .firstWhere((a) => a.name == 'Uni')
          .id;
      await r.projects.create(title: 'Active', areaId: uni);
      await r.projects.create(
        title: 'Uni backlog',
        areaId: uni,
        status: ProjectStatus.backlog,
      );
      await r.projects.create(title: 'Paused', status: ProjectStatus.paused);
      await r.projects.create(title: 'Done', status: ProjectStatus.completed);
    });

    Future<List<String>> titles(AreaFilter filter) async =>
        (await r.projects.watchBacklog(filter).first)
            .map((p) => p.title)
            .toList();

    test('lists exactly backlog and paused projects', () async {
      expect(
        await titles(const AllAreas()),
        unorderedEquals(['Uni backlog', 'Paused']),
      );
    });

    test('filters by area', () async {
      expect(await titles(InArea(uni)), ['Uni backlog']);
    });

    test('filters by no area', () async {
      expect(await titles(const NoArea()), ['Paused']);
    });
  });

  test('setStatus moves a project between statuses', () async {
    final p = await r.projects.create(
      title: 'Thesis',
      status: ProjectStatus.backlog,
    );
    await r.projects.setStatus(p.id, ProjectStatus.active);
    final stored = await r.projects.get(p.id);
    expect(stored!.status, ProjectStatus.active);
    expect(stored.updatedAt.isAfter(p.updatedAt), isTrue);
  });

  test(
    'watchCompleted lists completed projects, newest update first',
    () async {
      final a = await r.projects.create(title: 'A');
      final b = await r.projects.create(title: 'B');
      await r.projects.setStatus(b.id, ProjectStatus.completed);
      await r.projects.setStatus(a.id, ProjectStatus.completed);
      final done = await r.projects.watchCompleted().first;
      expect(done.map((p) => p.title), ['A', 'B']);
    },
  );

  test(
    'delete soft-deletes the project and its tasks and unlinks habits',
    () async {
      final p = await r.projects.create(title: 'Thesis', nextStep: 'Draft');
      final h = await r.habits.create(
        title: 'Write daily',
        projectId: p.id,
        scheduleType: ScheduleType.daily,
      );

      await r.projects.delete(p.id);

      expect(await r.projects.get(p.id), isNull);
      expect((await r.rawProject(p.id)).deletedAt, isNotNull);
      expect((await r.rawTask(p.nextStepTaskId!)).deletedAt, isNotNull);
      final habit = await r.rawHabit(h.id);
      expect(habit.projectId, isNull);
      expect(habit.deletedAt, isNull);
    },
  );
}
