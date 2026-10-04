import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/db/app_database.dart';
import '../../../core/db/database_providers.dart';
import '../../../core/db/ids.dart' show idGeneratorProvider;
import '../../../core/db/repository_support.dart';
import '../../../core/time/clock.dart' show clockProvider;

part 'area_repository.g.dart';

class AreaRepository extends Repository {
  AreaRepository(super.db, super.clock, super.newId);

  /// All areas in sort order.
  Stream<List<Area>> watchAll() =>
      (db.select(db.areas)
            ..where(alive)
            ..orderBy([
              (a) => OrderingTerm(expression: a.sortOrder),
              (a) => OrderingTerm(expression: a.createdAt),
            ]))
          .watch();

  /// Adds an area at the end of the list.
  Future<Area> create({required String name, required String color}) async {
    final now = clock();
    return db
        .into(db.areas)
        .insertReturning(
          AreasCompanion.insert(
            id: newId(),
            createdAt: now,
            updatedAt: now,
            name: name.trim(),
            color: color,
            sortOrder: await nextSortOrder(db.areas, (a) => a.sortOrder),
          ),
        );
  }

  Future<void> update(Area area) => db
      .update(db.areas)
      .replace(area.copyWith(name: area.name.trim(), updatedAt: clock()));

  /// Soft-deletes the area; its projects keep existing without an area.
  Future<void> delete(String id) => db.transaction(() async {
    await clearReference(db.projects, 'area_id', (p) => p.areaId.equals(id));
    await softDeleteWhere(db.areas, (a) => a.id.equals(id));
  });

  /// Whether another live area already uses [name] (trimmed,
  /// case-insensitive).
  Future<bool> isNameTaken(String name, {String? excludeId}) async {
    final wanted = name.trim().toLowerCase();
    final areas = await (db.select(db.areas)..where(alive)).get();
    return areas.any(
      (a) => a.id != excludeId && a.name.trim().toLowerCase() == wanted,
    );
  }
}

@Riverpod(keepAlive: true)
AreaRepository areaRepository(Ref ref) => AreaRepository(
  ref.watch(appDatabaseProvider),
  ref.watch(clockProvider),
  ref.watch(idGeneratorProvider),
);

/// All areas in sort order.
@riverpod
Stream<List<Area>> areas(Ref ref) =>
    ref.watch(areaRepositoryProvider).watchAll();
