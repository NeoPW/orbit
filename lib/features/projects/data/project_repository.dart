import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/db/app_database.dart';
import '../../../core/db/database_providers.dart';
import '../../../core/db/ids.dart' show idGeneratorProvider;
import '../../../core/db/repository_support.dart';
import '../../../core/time/clock.dart' show clockProvider;
import '../../tasks/data/task_repository.dart';
import '../../tasks/domain/next_step_choice.dart';
import 'area_filter.dart';

part 'project_repository.g.dart';

class ProjectRepository extends Repository {
  ProjectRepository(super.db, super.clock, super.newId)
    : _tasks = TaskRepository(db, clock, newId);

  final TaskRepository _tasks;

  SimpleSelectStatement<$ProjectsTable, Project> _query() =>
      db.select(db.projects)
        ..where(alive)
        ..orderBy([
          (p) => OrderingTerm.desc(p.importance),
          (p) => OrderingTerm(expression: p.title.lower()),
        ]);

  /// Projects with one of [statuses], most important first.
  Stream<List<Project>> watchByStatus(Set<ProjectStatus> statuses) =>
      (_query()..where((p) => p.status.isInValues(statuses))).watch();

  /// Backlog and paused projects matching [filter].
  Stream<List<Project>> watchBacklog(AreaFilter filter) {
    final query = _query()
      ..where(
        (p) =>
            p.status.isInValues({ProjectStatus.backlog, ProjectStatus.paused}),
      );
    switch (filter) {
      case AllAreas():
        break;
      case NoArea():
        query.where((p) => p.areaId.isNull());
      case InArea(:final areaId):
        query.where((p) => p.areaId.equals(areaId));
    }
    return query.watch();
  }

  /// Completed projects, most recently updated first.
  Stream<List<Project>> watchCompleted() =>
      (db.select(db.projects)
            ..where(
              (p) => alive(p) & p.status.equalsValue(ProjectStatus.completed),
            )
            ..orderBy([(p) => OrderingTerm.desc(p.updatedAt)]))
          .watch();

  Stream<Project?> watch(String id) =>
      (_query()..where((p) => p.id.equals(id))).watchSingleOrNull();

  Future<Project?> get(String id) =>
      (_query()..where((p) => p.id.equals(id))).getSingleOrNull();

  /// The project's next-step task, if it has one.
  Future<Task?> nextStep(Project project) async {
    final taskId = project.nextStepTaskId;
    return taskId == null ? null : _tasks.get(taskId);
  }

  /// Adds a project; a non-empty [nextStep] creates its next-step task.
  Future<Project> create({
    required String title,
    String description = '',
    String? areaId,
    String? keyResultId,
    ProjectStatus status = ProjectStatus.active,
    int importance = 3,
    CalendarDate? deadline,
    String nextStep = '',
  }) => db.transaction(() async {
    final now = clock();
    final project = await db
        .into(db.projects)
        .insertReturning(
          ProjectsCompanion.insert(
            id: newId(),
            createdAt: now,
            updatedAt: now,
            title: title.trim(),
            description: Value(description.trim()),
            areaId: Value(areaId),
            keyResultId: Value(keyResultId),
            status: status,
            importance: importance,
            deadline: Value(deadline),
          ),
        );
    return _saveNextStep(project, nextStep);
  });

  /// Saves all fields of [project] and its next step: setting it creates an
  /// open task and links it, changing it renames that task, clearing it
  /// removes the link and leaves the task open.
  Future<Project> save(Project project, {required String nextStep}) =>
      db.transaction(() async {
        final updated = project.copyWith(
          title: project.title.trim(),
          description: project.description.trim(),
          updatedAt: clock(),
        );
        await db.update(db.projects).replace(updated);
        return _saveNextStep(updated, nextStep);
      });

  Future<Project> _saveNextStep(Project project, String nextStep) async {
    final text = nextStep.trim();
    final current = await this.nextStep(project);

    if (text.isEmpty) {
      if (project.nextStepTaskId == null) return project;
      return _linkNextStep(project, null);
    }
    if (current != null) {
      if (current.title != text) await _tasks.updateTitle(current.id, text);
      return project;
    }
    final task = await _tasks.create(projectId: project.id, title: text);
    return _linkNextStep(project, task.id);
  }

  Future<Project> _linkNextStep(Project project, String? taskId) async {
    final updated = project.copyWith(
      nextStepTaskId: Value(taskId),
      updatedAt: clock(),
    );
    await db.update(db.projects).replace(updated);
    return updated;
  }

  /// Makes the open task [taskId] the project's next step, or clears the
  /// next step when null. A previous next-step task stays open.
  Future<void> setNextStep(String projectId, String? taskId) =>
      (db.update(
        db.projects,
      )..where((p) => p.id.equals(projectId) & alive(p))).write(
        ProjectsCompanion(
          nextStepTaskId: Value(taskId),
          updatedAt: Value(clock()),
        ),
      );

  /// Creates an open task [title] and makes it the project's next step.
  Future<Task> setNextStepFromTitle(String projectId, String title) =>
      db.transaction(() async {
        final task = await _tasks.create(projectId: projectId, title: title);
        await setNextStep(projectId, task.id);
        return task;
      });

  /// Completes the project's next-step task (logging it) and applies
  /// [choice]. Returns the log entry's ID for undo.
  Future<String> completeNextStep(String projectId, NextStepChoice choice) =>
      db.transaction(() async {
        final taskId = (await get(projectId))?.nextStepTaskId;
        if (taskId == null) {
          throw StateError('Project $projectId has no next step');
        }
        final logEntryId = await _tasks.complete(taskId);
        switch (choice) {
          case NewNextStep(:final title):
            await setNextStepFromTitle(projectId, title);
          case ExistingNextStep(:final taskId):
            await setNextStep(projectId, taskId);
          case NoNextStep():
            await setNextStep(projectId, null);
        }
        return logEntryId;
      });

  /// Changes only the status, e.g. "Activate" in the Backlog.
  Future<void> setStatus(String id, ProjectStatus status) =>
      (db.update(db.projects)..where((p) => p.id.equals(id) & alive(p))).write(
        ProjectsCompanion(status: Value(status), updatedAt: Value(clock())),
      );

  /// Soft-deletes the project and its tasks; its habits keep existing
  /// without the project link.
  Future<void> delete(String id) => db.transaction(() async {
    await clearReference(
      db.habits,
      'project_id',
      (h) => h.projectId.equals(id),
    );
    await _tasks.deleteForProject(id);
    await softDeleteWhere(db.projects, (p) => p.id.equals(id));
  });
}

@Riverpod(keepAlive: true)
ProjectRepository projectRepository(Ref ref) => ProjectRepository(
  ref.watch(appDatabaseProvider),
  ref.watch(clockProvider),
  ref.watch(idGeneratorProvider),
);

@riverpod
Stream<List<Project>> activeProjects(Ref ref) =>
    ref.watch(projectRepositoryProvider).watchByStatus({ProjectStatus.active});

/// Projects that are not completed (e.g. for linking habits).
@riverpod
Stream<List<Project>> openProjects(Ref ref) =>
    ref.watch(projectRepositoryProvider).watchByStatus({
      ProjectStatus.active,
      ProjectStatus.backlog,
      ProjectStatus.paused,
    });

@riverpod
Stream<List<Project>> backlogProjects(Ref ref, AreaFilter filter) =>
    ref.watch(projectRepositoryProvider).watchBacklog(filter);

@riverpod
Stream<Project?> project(Ref ref, String id) =>
    ref.watch(projectRepositoryProvider).watch(id);

/// Completed projects, most recently updated first.
@riverpod
Stream<List<Project>> completedProjects(Ref ref) =>
    ref.watch(projectRepositoryProvider).watchCompleted();

/// All projects, any status (e.g. to show a habit's linked project).
@riverpod
Stream<List<Project>> allProjects(Ref ref) => ref
    .watch(projectRepositoryProvider)
    .watchByStatus(ProjectStatus.values.toSet());
