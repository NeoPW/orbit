// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'log_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(logRepository)
final logRepositoryProvider = LogRepositoryProvider._();

final class LogRepositoryProvider
    extends $FunctionalProvider<LogRepository, LogRepository, LogRepository>
    with $Provider<LogRepository> {
  LogRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'logRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$logRepositoryHash();

  @$internal
  @override
  $ProviderElement<LogRepository> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  LogRepository create(Ref ref) {
    return logRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(LogRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<LogRepository>(value),
    );
  }
}

String _$logRepositoryHash() => r'08b7668151ce5c1e5cd0979c1530b794e2c63974';

/// A project's log entries, most recent first.

@ProviderFor(projectLog)
final projectLogProvider = ProjectLogFamily._();

/// A project's log entries, most recent first.

final class ProjectLogProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<LogEntry>>,
          List<LogEntry>,
          Stream<List<LogEntry>>
        >
    with $FutureModifier<List<LogEntry>>, $StreamProvider<List<LogEntry>> {
  /// A project's log entries, most recent first.
  ProjectLogProvider._({
    required ProjectLogFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'projectLogProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$projectLogHash();

  @override
  String toString() {
    return r'projectLogProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $StreamProviderElement<List<LogEntry>> $createElement(
    $ProviderPointer pointer,
  ) => $StreamProviderElement(pointer);

  @override
  Stream<List<LogEntry>> create(Ref ref) {
    final argument = this.argument as String;
    return projectLog(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is ProjectLogProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$projectLogHash() => r'e62b4f70810fc7104f75b573fafc19d059cd5829';

/// A project's log entries, most recent first.

final class ProjectLogFamily extends $Family
    with $FunctionalFamilyOverride<Stream<List<LogEntry>>, String> {
  ProjectLogFamily._()
    : super(
        retry: null,
        name: r'projectLogProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  /// A project's log entries, most recent first.

  ProjectLogProvider call(String projectId) =>
      ProjectLogProvider._(argument: projectId, from: this);

  @override
  String toString() => r'projectLogProvider';
}

/// The time of each project's most recent log entry.

@ProviderFor(lastLoggedAt)
final lastLoggedAtProvider = LastLoggedAtProvider._();

/// The time of each project's most recent log entry.

final class LastLoggedAtProvider
    extends
        $FunctionalProvider<
          AsyncValue<Map<String, DateTime>>,
          Map<String, DateTime>,
          Stream<Map<String, DateTime>>
        >
    with
        $FutureModifier<Map<String, DateTime>>,
        $StreamProvider<Map<String, DateTime>> {
  /// The time of each project's most recent log entry.
  LastLoggedAtProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'lastLoggedAtProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$lastLoggedAtHash();

  @$internal
  @override
  $StreamProviderElement<Map<String, DateTime>> $createElement(
    $ProviderPointer pointer,
  ) => $StreamProviderElement(pointer);

  @override
  Stream<Map<String, DateTime>> create(Ref ref) {
    return lastLoggedAt(ref);
  }
}

String _$lastLoggedAtHash() => r'f9f89427a2316fa4d533b84a50bd2addc3ded23c';

/// A task's log entries, most recent first.

@ProviderFor(taskLog)
final taskLogProvider = TaskLogFamily._();

/// A task's log entries, most recent first.

final class TaskLogProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<LogEntry>>,
          List<LogEntry>,
          Stream<List<LogEntry>>
        >
    with $FutureModifier<List<LogEntry>>, $StreamProvider<List<LogEntry>> {
  /// A task's log entries, most recent first.
  TaskLogProvider._({
    required TaskLogFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'taskLogProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$taskLogHash();

  @override
  String toString() {
    return r'taskLogProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $StreamProviderElement<List<LogEntry>> $createElement(
    $ProviderPointer pointer,
  ) => $StreamProviderElement(pointer);

  @override
  Stream<List<LogEntry>> create(Ref ref) {
    final argument = this.argument as String;
    return taskLog(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is TaskLogProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$taskLogHash() => r'06a6659b65ab159d2c438378d2f73f624d42df26';

/// A task's log entries, most recent first.

final class TaskLogFamily extends $Family
    with $FunctionalFamilyOverride<Stream<List<LogEntry>>, String> {
  TaskLogFamily._()
    : super(
        retry: null,
        name: r'taskLogProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  /// A task's log entries, most recent first.

  TaskLogProvider call(String taskId) =>
      TaskLogProvider._(argument: taskId, from: this);

  @override
  String toString() => r'taskLogProvider';
}

/// The time of each task's most recent log entry.

@ProviderFor(lastLoggedAtTasks)
final lastLoggedAtTasksProvider = LastLoggedAtTasksProvider._();

/// The time of each task's most recent log entry.

final class LastLoggedAtTasksProvider
    extends
        $FunctionalProvider<
          AsyncValue<Map<String, DateTime>>,
          Map<String, DateTime>,
          Stream<Map<String, DateTime>>
        >
    with
        $FutureModifier<Map<String, DateTime>>,
        $StreamProvider<Map<String, DateTime>> {
  /// The time of each task's most recent log entry.
  LastLoggedAtTasksProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'lastLoggedAtTasksProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$lastLoggedAtTasksHash();

  @$internal
  @override
  $StreamProviderElement<Map<String, DateTime>> $createElement(
    $ProviderPointer pointer,
  ) => $StreamProviderElement(pointer);

  @override
  Stream<Map<String, DateTime>> create(Ref ref) {
    return lastLoggedAtTasks(ref);
  }
}

String _$lastLoggedAtTasksHash() => r'd359414692c3eba9896a721e98968c9c86ecf4c7';

/// A key result's log entries, most recent first.

@ProviderFor(keyResultLog)
final keyResultLogProvider = KeyResultLogFamily._();

/// A key result's log entries, most recent first.

final class KeyResultLogProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<LogEntry>>,
          List<LogEntry>,
          Stream<List<LogEntry>>
        >
    with $FutureModifier<List<LogEntry>>, $StreamProvider<List<LogEntry>> {
  /// A key result's log entries, most recent first.
  KeyResultLogProvider._({
    required KeyResultLogFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'keyResultLogProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$keyResultLogHash();

  @override
  String toString() {
    return r'keyResultLogProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $StreamProviderElement<List<LogEntry>> $createElement(
    $ProviderPointer pointer,
  ) => $StreamProviderElement(pointer);

  @override
  Stream<List<LogEntry>> create(Ref ref) {
    final argument = this.argument as String;
    return keyResultLog(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is KeyResultLogProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$keyResultLogHash() => r'28ea50bbee169c2ee647d1454db36657cc7660af';

/// A key result's log entries, most recent first.

final class KeyResultLogFamily extends $Family
    with $FunctionalFamilyOverride<Stream<List<LogEntry>>, String> {
  KeyResultLogFamily._()
    : super(
        retry: null,
        name: r'keyResultLogProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  /// A key result's log entries, most recent first.

  KeyResultLogProvider call(String keyResultId) =>
      KeyResultLogProvider._(argument: keyResultId, from: this);

  @override
  String toString() => r'keyResultLogProvider';
}
