import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/db/app_database.dart';
import '../../../core/db/database_providers.dart';
import '../../../core/db/ids.dart' show idGeneratorProvider;
import '../../../core/db/repository_support.dart';
import '../../../core/time/clock.dart' show clockProvider;

part 'task_repository.g.dart';

/// Tasks. In milestone 1 only used for project next steps.
class TaskRepository extends Repository {
  TaskRepository(super.db, super.clock, super.newId);

  Future<Task?> get(String id) => (db.select(
    db.tasks,
  )..where((t) => t.id.equals(id) & alive(t))).getSingleOrNull();

  /// Adds an open task.
  Future<Task> create({required String? projectId, required String title}) {
    final now = clock();
    return db
        .into(db.tasks)
        .insertReturning(
          TasksCompanion.insert(
            id: newId(),
            createdAt: now,
            updatedAt: now,
            projectId: Value(projectId),
            title: title.trim(),
            status: TaskStatus.open,
          ),
        );
  }

  Future<void> updateTitle(String id, String title) =>
      (db.update(db.tasks)..where((t) => t.id.equals(id) & alive(t))).write(
        TasksCompanion(title: Value(title.trim()), updatedAt: Value(clock())),
      );

  /// Soft-deletes all tasks of a project.
  Future<void> deleteForProject(String projectId) =>
      softDeleteWhere(db.tasks, (t) => t.projectId.equals(projectId));
}

@Riverpod(keepAlive: true)
TaskRepository taskRepository(Ref ref) => TaskRepository(
  ref.watch(appDatabaseProvider),
  ref.watch(clockProvider),
  ref.watch(idGeneratorProvider),
);
