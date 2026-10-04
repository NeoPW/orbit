import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/features/areas/data/area_repository.dart';

import '../../../helpers/test_db.dart';

void main() {
  late AppDatabase db;
  late TestClock clock;
  late AreaRepository repo;

  setUp(() {
    db = newTestDatabase();
    clock = TestClock();
    repo = AreaRepository(db, clock.call, TestIds().call);
  });
  tearDown(() => db.close());

  Future<List<String>> names() async =>
      (await repo.watchAll().first).map((a) => a.name).toList();

  group('shared repository behavior', () {
    test('create sets id and equal UTC timestamps', () async {
      final area = await repo.create(name: 'Family', color: '#E53935');
      expect(area.id, 'id-1');
      expect(area.createdAt, area.updatedAt);
      expect(area.createdAt.isUtc, isTrue);
      expect(area.deletedAt, isNull);
    });

    test('update bumps only updated_at', () async {
      final area = await repo.create(name: 'Family', color: '#E53935');
      await repo.update(area.copyWith(name: 'Kids'));

      final stored = await (db.select(
        db.areas,
      )..where((a) => a.id.equals(area.id))).getSingle();
      expect(stored.name, 'Kids');
      expect(stored.createdAt, area.createdAt);
      expect(stored.updatedAt.isAfter(area.updatedAt), isTrue);
    });

    test('delete keeps the row with deleted_at set and hides it', () async {
      final area = await repo.create(name: 'Family', color: '#E53935');
      await repo.delete(area.id);

      final stored = await (db.select(
        db.areas,
      )..where((a) => a.id.equals(area.id))).getSingle();
      expect(stored.deletedAt, isNotNull);
      expect(stored.updatedAt, stored.deletedAt);
      expect(await names(), isNot(contains('Family')));
    });
  });

  test('watchAll lists seeded areas in sort order', () async {
    expect(await names(), ['Job', 'Personal', 'Sport', 'Uni']);
  });

  test('create appends at the end and trims the name', () async {
    await repo.create(name: '  Family ', color: '#E53935');
    expect(await names(), ['Job', 'Personal', 'Sport', 'Uni', 'Family']);
  });

  test('watchAll emits again after a change', () async {
    final emissions = repo.watchAll().map((a) => a.length);
    final expectation = expectLater(emissions, emitsInOrder([4, 5]));
    await Future<void>.delayed(Duration.zero);
    await repo.create(name: 'Family', color: '#E53935');
    await expectation;
  });

  group('isNameTaken', () {
    test('is case-insensitive and trimmed', () async {
      expect(await repo.isNameTaken('sport'), isTrue);
      expect(await repo.isNameTaken(' SPORT '), isTrue);
      expect(await repo.isNameTaken('Family'), isFalse);
    });

    test('ignores the area being edited', () async {
      final sport = (await repo.watchAll().first).firstWhere(
        (a) => a.name == 'Sport',
      );
      expect(await repo.isNameTaken('Sport', excludeId: sport.id), isFalse);
    });

    test('ignores deleted areas', () async {
      final uni = (await repo.watchAll().first).firstWhere(
        (a) => a.name == 'Uni',
      );
      await repo.delete(uni.id);
      expect(await repo.isNameTaken('Uni'), isFalse);
    });
  });

  test('delete unlinks projects in the area', () async {
    final area = await repo.create(name: 'Family', color: '#E53935');
    final now = DateTime.utc(2026, 10, 1);
    await db
        .into(db.projects)
        .insert(
          ProjectsCompanion.insert(
            id: 'p1',
            createdAt: now,
            updatedAt: now,
            title: 'Holiday',
            status: ProjectStatus.active,
            importance: 3,
            areaId: Value(area.id),
          ),
        );

    await repo.delete(area.id);

    final project = await (db.select(
      db.projects,
    )..where((p) => p.id.equals('p1'))).getSingle();
    expect(project.areaId, isNull);
    expect(project.updatedAt.isAfter(now), isTrue);
    expect(project.deletedAt, isNull);
  });
}
