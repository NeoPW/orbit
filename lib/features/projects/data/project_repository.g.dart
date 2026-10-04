// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'project_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(projectRepository)
final projectRepositoryProvider = ProjectRepositoryProvider._();

final class ProjectRepositoryProvider
    extends
        $FunctionalProvider<
          ProjectRepository,
          ProjectRepository,
          ProjectRepository
        >
    with $Provider<ProjectRepository> {
  ProjectRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'projectRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$projectRepositoryHash();

  @$internal
  @override
  $ProviderElement<ProjectRepository> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  ProjectRepository create(Ref ref) {
    return projectRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(ProjectRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<ProjectRepository>(value),
    );
  }
}

String _$projectRepositoryHash() => r'a6b20f3f9f5cd231ca75e6b3526acf85c9c51dda';

@ProviderFor(activeProjects)
final activeProjectsProvider = ActiveProjectsProvider._();

final class ActiveProjectsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Project>>,
          List<Project>,
          Stream<List<Project>>
        >
    with $FutureModifier<List<Project>>, $StreamProvider<List<Project>> {
  ActiveProjectsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'activeProjectsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$activeProjectsHash();

  @$internal
  @override
  $StreamProviderElement<List<Project>> $createElement(
    $ProviderPointer pointer,
  ) => $StreamProviderElement(pointer);

  @override
  Stream<List<Project>> create(Ref ref) {
    return activeProjects(ref);
  }
}

String _$activeProjectsHash() => r'450d6e5a0d6367ddd295c989636d31168562bad9';

/// Projects that are not completed (e.g. for linking habits).

@ProviderFor(openProjects)
final openProjectsProvider = OpenProjectsProvider._();

/// Projects that are not completed (e.g. for linking habits).

final class OpenProjectsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Project>>,
          List<Project>,
          Stream<List<Project>>
        >
    with $FutureModifier<List<Project>>, $StreamProvider<List<Project>> {
  /// Projects that are not completed (e.g. for linking habits).
  OpenProjectsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'openProjectsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$openProjectsHash();

  @$internal
  @override
  $StreamProviderElement<List<Project>> $createElement(
    $ProviderPointer pointer,
  ) => $StreamProviderElement(pointer);

  @override
  Stream<List<Project>> create(Ref ref) {
    return openProjects(ref);
  }
}

String _$openProjectsHash() => r'4899e4edfd8b6127f0f9d08280d2577e05b1f383';

@ProviderFor(backlogProjects)
final backlogProjectsProvider = BacklogProjectsFamily._();

final class BacklogProjectsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Project>>,
          List<Project>,
          Stream<List<Project>>
        >
    with $FutureModifier<List<Project>>, $StreamProvider<List<Project>> {
  BacklogProjectsProvider._({
    required BacklogProjectsFamily super.from,
    required AreaFilter super.argument,
  }) : super(
         retry: null,
         name: r'backlogProjectsProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$backlogProjectsHash();

  @override
  String toString() {
    return r'backlogProjectsProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $StreamProviderElement<List<Project>> $createElement(
    $ProviderPointer pointer,
  ) => $StreamProviderElement(pointer);

  @override
  Stream<List<Project>> create(Ref ref) {
    final argument = this.argument as AreaFilter;
    return backlogProjects(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is BacklogProjectsProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$backlogProjectsHash() => r'c769aa4a6616031071fa5bcfd783fb3f345f719e';

final class BacklogProjectsFamily extends $Family
    with $FunctionalFamilyOverride<Stream<List<Project>>, AreaFilter> {
  BacklogProjectsFamily._()
    : super(
        retry: null,
        name: r'backlogProjectsProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  BacklogProjectsProvider call(AreaFilter filter) =>
      BacklogProjectsProvider._(argument: filter, from: this);

  @override
  String toString() => r'backlogProjectsProvider';
}

@ProviderFor(project)
final projectProvider = ProjectFamily._();

final class ProjectProvider
    extends
        $FunctionalProvider<AsyncValue<Project?>, Project?, Stream<Project?>>
    with $FutureModifier<Project?>, $StreamProvider<Project?> {
  ProjectProvider._({
    required ProjectFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'projectProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$projectHash();

  @override
  String toString() {
    return r'projectProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $StreamProviderElement<Project?> $createElement($ProviderPointer pointer) =>
      $StreamProviderElement(pointer);

  @override
  Stream<Project?> create(Ref ref) {
    final argument = this.argument as String;
    return project(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is ProjectProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$projectHash() => r'b9677a35182940a813ca81dbda1218e688815a44';

final class ProjectFamily extends $Family
    with $FunctionalFamilyOverride<Stream<Project?>, String> {
  ProjectFamily._()
    : super(
        retry: null,
        name: r'projectProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  ProjectProvider call(String id) =>
      ProjectProvider._(argument: id, from: this);

  @override
  String toString() => r'projectProvider';
}

/// Completed projects, most recently updated first.

@ProviderFor(completedProjects)
final completedProjectsProvider = CompletedProjectsProvider._();

/// Completed projects, most recently updated first.

final class CompletedProjectsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Project>>,
          List<Project>,
          Stream<List<Project>>
        >
    with $FutureModifier<List<Project>>, $StreamProvider<List<Project>> {
  /// Completed projects, most recently updated first.
  CompletedProjectsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'completedProjectsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$completedProjectsHash();

  @$internal
  @override
  $StreamProviderElement<List<Project>> $createElement(
    $ProviderPointer pointer,
  ) => $StreamProviderElement(pointer);

  @override
  Stream<List<Project>> create(Ref ref) {
    return completedProjects(ref);
  }
}

String _$completedProjectsHash() => r'559894b41cfa655ec949172419779a8d6645360f';

/// All projects, any status (e.g. to show a habit's linked project).

@ProviderFor(allProjects)
final allProjectsProvider = AllProjectsProvider._();

/// All projects, any status (e.g. to show a habit's linked project).

final class AllProjectsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Project>>,
          List<Project>,
          Stream<List<Project>>
        >
    with $FutureModifier<List<Project>>, $StreamProvider<List<Project>> {
  /// All projects, any status (e.g. to show a habit's linked project).
  AllProjectsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'allProjectsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$allProjectsHash();

  @$internal
  @override
  $StreamProviderElement<List<Project>> $createElement(
    $ProviderPointer pointer,
  ) => $StreamProviderElement(pointer);

  @override
  Stream<List<Project>> create(Ref ref) {
    return allProjects(ref);
  }
}

String _$allProjectsHash() => r'3bf00a02077e6685227f8606f0e784a29ed6ee3b';
