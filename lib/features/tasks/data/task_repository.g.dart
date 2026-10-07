// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'task_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(taskRepository)
final taskRepositoryProvider = TaskRepositoryProvider._();

final class TaskRepositoryProvider
    extends $FunctionalProvider<TaskRepository, TaskRepository, TaskRepository>
    with $Provider<TaskRepository> {
  TaskRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'taskRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$taskRepositoryHash();

  @$internal
  @override
  $ProviderElement<TaskRepository> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  TaskRepository create(Ref ref) {
    return taskRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(TaskRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<TaskRepository>(value),
    );
  }
}

String _$taskRepositoryHash() => r'ff9e702ef0458435a2662ee6829f8138d1f62e4a';

/// All open tasks (e.g. to look up next steps).

@ProviderFor(openTasks)
final openTasksProvider = OpenTasksProvider._();

/// All open tasks (e.g. to look up next steps).

final class OpenTasksProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Task>>,
          List<Task>,
          Stream<List<Task>>
        >
    with $FutureModifier<List<Task>>, $StreamProvider<List<Task>> {
  /// All open tasks (e.g. to look up next steps).
  OpenTasksProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'openTasksProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$openTasksHash();

  @$internal
  @override
  $StreamProviderElement<List<Task>> $createElement($ProviderPointer pointer) =>
      $StreamProviderElement(pointer);

  @override
  Stream<List<Task>> create(Ref ref) {
    return openTasks(ref);
  }
}

String _$openTasksHash() => r'ba4984b1ec25ef43564a058e2f4905371bf97232';

/// A project's open tasks in list order.

@ProviderFor(projectOpenTasks)
final projectOpenTasksProvider = ProjectOpenTasksFamily._();

/// A project's open tasks in list order.

final class ProjectOpenTasksProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Task>>,
          List<Task>,
          Stream<List<Task>>
        >
    with $FutureModifier<List<Task>>, $StreamProvider<List<Task>> {
  /// A project's open tasks in list order.
  ProjectOpenTasksProvider._({
    required ProjectOpenTasksFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'projectOpenTasksProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$projectOpenTasksHash();

  @override
  String toString() {
    return r'projectOpenTasksProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $StreamProviderElement<List<Task>> $createElement($ProviderPointer pointer) =>
      $StreamProviderElement(pointer);

  @override
  Stream<List<Task>> create(Ref ref) {
    final argument = this.argument as String;
    return projectOpenTasks(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is ProjectOpenTasksProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$projectOpenTasksHash() => r'd1829e0eef8fc7d2440a0a1981d47c80eaab4077';

/// A project's open tasks in list order.

final class ProjectOpenTasksFamily extends $Family
    with $FunctionalFamilyOverride<Stream<List<Task>>, String> {
  ProjectOpenTasksFamily._()
    : super(
        retry: null,
        name: r'projectOpenTasksProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  /// A project's open tasks in list order.

  ProjectOpenTasksProvider call(String projectId) =>
      ProjectOpenTasksProvider._(argument: projectId, from: this);

  @override
  String toString() => r'projectOpenTasksProvider';
}

/// Open tasks with a due date of active projects.

@ProviderFor(dueTasks)
final dueTasksProvider = DueTasksProvider._();

/// Open tasks with a due date of active projects.

final class DueTasksProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<TaskWithProject>>,
          List<TaskWithProject>,
          Stream<List<TaskWithProject>>
        >
    with
        $FutureModifier<List<TaskWithProject>>,
        $StreamProvider<List<TaskWithProject>> {
  /// Open tasks with a due date of active projects.
  DueTasksProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'dueTasksProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$dueTasksHash();

  @$internal
  @override
  $StreamProviderElement<List<TaskWithProject>> $createElement(
    $ProviderPointer pointer,
  ) => $StreamProviderElement(pointer);

  @override
  Stream<List<TaskWithProject>> create(Ref ref) {
    return dueTasks(ref);
  }
}

String _$dueTasksHash() => r'4a3098e8ba1077e7e2b5350dbe908a87cdb2f9f7';

/// A task, open or done.

@ProviderFor(task)
final taskProvider = TaskFamily._();

/// A task, open or done.

final class TaskProvider
    extends $FunctionalProvider<AsyncValue<Task?>, Task?, Stream<Task?>>
    with $FutureModifier<Task?>, $StreamProvider<Task?> {
  /// A task, open or done.
  TaskProvider._({
    required TaskFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'taskProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$taskHash();

  @override
  String toString() {
    return r'taskProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $StreamProviderElement<Task?> $createElement($ProviderPointer pointer) =>
      $StreamProviderElement(pointer);

  @override
  Stream<Task?> create(Ref ref) {
    final argument = this.argument as String;
    return task(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is TaskProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$taskHash() => r'38c285bae04dbe53f57995c0291d238e292e5ea3';

/// A task, open or done.

final class TaskFamily extends $Family
    with $FunctionalFamilyOverride<Stream<Task?>, String> {
  TaskFamily._()
    : super(
        retry: null,
        name: r'taskProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  /// A task, open or done.

  TaskProvider call(String id) => TaskProvider._(argument: id, from: this);

  @override
  String toString() => r'taskProvider';
}

/// Open tasks outside projects, for Home.

@ProviderFor(tasksOutsideProjects)
final tasksOutsideProjectsProvider = TasksOutsideProjectsProvider._();

/// Open tasks outside projects, for Home.

final class TasksOutsideProjectsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Task>>,
          List<Task>,
          Stream<List<Task>>
        >
    with $FutureModifier<List<Task>>, $StreamProvider<List<Task>> {
  /// Open tasks outside projects, for Home.
  TasksOutsideProjectsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'tasksOutsideProjectsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$tasksOutsideProjectsHash();

  @$internal
  @override
  $StreamProviderElement<List<Task>> $createElement($ProviderPointer pointer) =>
      $StreamProviderElement(pointer);

  @override
  Stream<List<Task>> create(Ref ref) {
    return tasksOutsideProjects(ref);
  }
}

String _$tasksOutsideProjectsHash() =>
    r'6d75fc06a6ea98f91857f3868b5739b652570ddc';

/// Open tasks assigned to a KR or objective, for Plan.

@ProviderFor(assignedTasks)
final assignedTasksProvider = AssignedTasksProvider._();

/// Open tasks assigned to a KR or objective, for Plan.

final class AssignedTasksProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Task>>,
          List<Task>,
          Stream<List<Task>>
        >
    with $FutureModifier<List<Task>>, $StreamProvider<List<Task>> {
  /// Open tasks assigned to a KR or objective, for Plan.
  AssignedTasksProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'assignedTasksProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$assignedTasksHash();

  @$internal
  @override
  $StreamProviderElement<List<Task>> $createElement($ProviderPointer pointer) =>
      $StreamProviderElement(pointer);

  @override
  Stream<List<Task>> create(Ref ref) {
    return assignedTasks(ref);
  }
}

String _$assignedTasksHash() => r'95e849d5af61cc533b74614821b28d48473955b0';
