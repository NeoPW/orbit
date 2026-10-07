import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/db/app_database.dart';
import '../../../core/db/database_providers.dart';
import '../../../core/db/ids.dart' show idGeneratorProvider;
import '../../../core/db/repository_support.dart';
import '../../../core/time/clock.dart' show clockProvider;
import '../../log/data/log_repository.dart';
import '../domain/task_assignment.dart';

part 'task_repository.g.dart';

/// An open task together with its project.
typedef TaskWithProject = ({Task task, Project project});

/// Tasks: standalone or assigned to one project, key result or objective.
/// Completing a task logs it (source task).
class TaskRepository extends Repository {
  TaskRepository(super.db, super.clock, super.newId)
    : _logs = LogRepository(db, clock, newId);

  final LogRepository _logs;

  SimpleSelectStatement<$TasksTable, Task> _open() => db.select(db.tasks)
    ..where((t) => alive(t) & t.status.equalsValue(TaskStatus.open))
    ..orderBy([
      (t) => OrderingTerm(expression: t.dueDate.isNull()),
      (t) => OrderingTerm(expression: t.dueDate),
      (t) => OrderingTerm(expression: t.createdAt),
    ]);

  Future<Task?> get(String id) => (db.select(
    db.tasks,
  )..where((t) => t.id.equals(id) & alive(t))).getSingleOrNull();

  /// All open tasks, due date first (none last), then oldest first.
  Stream<List<Task>> watchOpen() => _open().watch();

  /// The project's open tasks, due date first (none last), then oldest
  /// first (tasks spec, "Open task order").
  Stream<List<Task>> watchOpenForProject(String projectId) =>
      (_open()..where((t) => t.projectId.equals(projectId))).watch();

  /// The project's open tasks in list order, read once.
  Future<List<Task>> openForProject(String projectId) =>
      (_open()..where((t) => t.projectId.equals(projectId))).get();

  /// Open tasks with a due date whose project is active, with the project.
  Stream<List<TaskWithProject>> watchOpenWithDueDate() {
    final query =
        db.select(db.tasks).join([
          innerJoin(db.projects, db.projects.id.equalsExp(db.tasks.projectId)),
        ])..where(
          alive(db.tasks) &
              db.tasks.status.equalsValue(TaskStatus.open) &
              db.tasks.dueDate.isNotNull() &
              alive(db.projects) &
              db.projects.status.equalsValue(ProjectStatus.active),
        );
    return query.watch().map(
      (rows) => [
        for (final row in rows)
          (task: row.readTable(db.tasks), project: row.readTable(db.projects)),
      ],
    );
  }

  /// Done tasks with `completed_at` in [from, to).
  Stream<List<Task>> watchCompletedBetween(DateTime from, DateTime to) =>
      (db.select(db.tasks)..where(
            (t) =>
                alive(t) &
                t.status.equalsValue(TaskStatus.done) &
                t.completedAt.isBiggerOrEqualValue(from.toUtc()) &
                t.completedAt.isSmallerThanValue(to.toUtc()),
          ))
          .watch();

  /// The task (open or done), live.
  Stream<Task?> watch(String id) => (db.select(
    db.tasks,
  )..where((t) => t.id.equals(id) & alive(t))).watchSingleOrNull();

  /// Open tasks that are not part of a project (standalone or assigned to a
  /// KR or objective): due date first (none last), then oldest first.
  Stream<List<Task>> watchOpenOutsideProjects() =>
      (_open()..where((t) => t.projectId.isNull())).watch();

  /// Open tasks assigned to a KR or an objective.
  Stream<List<Task>> watchOpenAssigned() =>
      (_open()..where(
            (t) => t.keyResultId.isNotNull() | t.objectiveId.isNotNull(),
          ))
          .watch();

  /// Adds an open task. [projectId] is a shorthand for [InProject];
  /// [assignment] wins when both are given.
  Future<Task> create({
    String? projectId,
    TaskAssignment? assignment,
    required String title,
    String notes = '',
    CalendarDate? dueDate,
  }) {
    final now = clock();
    final to =
        assignment ??
        (projectId == null ? const Standalone() : InProject(projectId));
    return db
        .into(db.tasks)
        .insertReturning(
          TasksCompanion.insert(
            id: newId(),
            createdAt: now,
            updatedAt: now,
            projectId: Value(to.projectId),
            keyResultId: Value(to.keyResultId),
            objectiveId: Value(to.objectiveId),
            title: title.trim(),
            notes: Value(notes.trim()),
            dueDate: Value(dueDate),
            status: TaskStatus.open,
          ),
        );
  }

  Future<void> updateTitle(String id, String title) =>
      (db.update(db.tasks)..where((t) => t.id.equals(id) & alive(t))).write(
        TasksCompanion(title: Value(title.trim()), updatedAt: Value(clock())),
      );

  /// Saves the title, notes and due date of [task], and its [assignment]
  /// when given. A task leaving the project whose next step it was leaves
  /// that project without a next step.
  Future<void> update(Task task, {TaskAssignment? assignment}) =>
      db.transaction(() async {
        final previous = await get(task.id);
        await (db.update(
          db.tasks,
        )..where((t) => t.id.equals(task.id) & alive(t))).write(
          TasksCompanion(
            title: Value(task.title.trim()),
            notes: Value(task.notes.trim()),
            dueDate: Value(task.dueDate),
            updatedAt: Value(clock()),
            projectId: assignment == null
                ? const Value.absent()
                : Value(assignment.projectId),
            keyResultId: assignment == null
                ? const Value.absent()
                : Value(assignment.keyResultId),
            objectiveId: assignment == null
                ? const Value.absent()
                : Value(assignment.objectiveId),
          ),
        );
        final oldProject = previous?.projectId;
        if (assignment != null &&
            oldProject != null &&
            assignment.projectId != oldProject) {
          await clearReference(
            db.projects,
            'next_step_task_id',
            (p) => p.id.equals(oldProject) & p.nextStepTaskId.equals(task.id),
          );
        }
      });

  /// Opens a done task again; its log entries stay.
  Future<void> reopen(String id) =>
      (db.update(db.tasks)..where((t) => t.id.equals(id) & alive(t))).write(
        TasksCompanion(
          status: const Value(TaskStatus.open),
          completedAt: const Value(null),
          updatedAt: Value(clock()),
        ),
      );

  /// Marks the task done and logs it; returns the log entry's ID, which
  /// [undoComplete] needs.
  Future<String> complete(String id) => db.transaction(() async {
    final task = await get(id);
    if (task == null) throw StateError('Task $id does not exist');
    final now = clock();
    await (db.update(db.tasks)..where((t) => t.id.equals(id))).write(
      TasksCompanion(
        status: const Value(TaskStatus.done),
        completedAt: Value(now),
        updatedAt: Value(now),
      ),
    );
    final entry = await _logs.add(
      projectId: task.projectId,
      keyResultId: task.keyResultId,
      taskId: task.id,
      note: task.title,
      source: LogSource.task,
    );
    return entry.id;
  });

  /// Reverts [complete]: the task is open again and its log entry is gone.
  Future<void> undoComplete(String id, String logEntryId) =>
      db.transaction(() async {
        await (db.update(
          db.tasks,
        )..where((t) => t.id.equals(id) & alive(t))).write(
          TasksCompanion(
            status: const Value(TaskStatus.open),
            completedAt: const Value(null),
            updatedAt: Value(clock()),
          ),
        );
        await _logs.delete(logEntryId);
      });

  /// Soft-deletes the task. A project whose next step it was has no next
  /// step afterwards. Log entries from completing it remain.
  Future<void> delete(String id) => db.transaction(() async {
    await clearReference(
      db.projects,
      'next_step_task_id',
      (p) => p.nextStepTaskId.equals(id),
    );
    await softDeleteWhere(db.tasks, (t) => t.id.equals(id));
  });

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

/// All open tasks (e.g. to look up next steps).
@riverpod
Stream<List<Task>> openTasks(Ref ref) =>
    ref.watch(taskRepositoryProvider).watchOpen();

/// A project's open tasks in list order.
@riverpod
Stream<List<Task>> projectOpenTasks(Ref ref, String projectId) =>
    ref.watch(taskRepositoryProvider).watchOpenForProject(projectId);

/// Open tasks with a due date of active projects.
@riverpod
Stream<List<TaskWithProject>> dueTasks(Ref ref) =>
    ref.watch(taskRepositoryProvider).watchOpenWithDueDate();

/// A task, open or done.
@riverpod
Stream<Task?> task(Ref ref, String id) =>
    ref.watch(taskRepositoryProvider).watch(id);

/// Open tasks outside projects, for Home.
@riverpod
Stream<List<Task>> tasksOutsideProjects(Ref ref) =>
    ref.watch(taskRepositoryProvider).watchOpenOutsideProjects();

/// Open tasks assigned to a KR or objective, for Plan.
@riverpod
Stream<List<Task>> assignedTasks(Ref ref) =>
    ref.watch(taskRepositoryProvider).watchOpenAssigned();
