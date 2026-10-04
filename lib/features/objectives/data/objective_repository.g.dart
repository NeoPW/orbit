// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'objective_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(objectiveRepository)
final objectiveRepositoryProvider = ObjectiveRepositoryProvider._();

final class ObjectiveRepositoryProvider
    extends
        $FunctionalProvider<
          ObjectiveRepository,
          ObjectiveRepository,
          ObjectiveRepository
        >
    with $Provider<ObjectiveRepository> {
  ObjectiveRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'objectiveRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$objectiveRepositoryHash();

  @$internal
  @override
  $ProviderElement<ObjectiveRepository> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  ObjectiveRepository create(Ref ref) {
    return objectiveRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(ObjectiveRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<ObjectiveRepository>(value),
    );
  }
}

String _$objectiveRepositoryHash() =>
    r'022f916928f31e8e3ecaa7afc11c925c9641f875';

/// All objectives, any status, in sort order.

@ProviderFor(objectives)
final objectivesProvider = ObjectivesProvider._();

/// All objectives, any status, in sort order.

final class ObjectivesProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Objective>>,
          List<Objective>,
          Stream<List<Objective>>
        >
    with $FutureModifier<List<Objective>>, $StreamProvider<List<Objective>> {
  /// All objectives, any status, in sort order.
  ObjectivesProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'objectivesProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$objectivesHash();

  @$internal
  @override
  $StreamProviderElement<List<Objective>> $createElement(
    $ProviderPointer pointer,
  ) => $StreamProviderElement(pointer);

  @override
  Stream<List<Objective>> create(Ref ref) {
    return objectives(ref);
  }
}

String _$objectivesHash() => r'aee191f96599f11184d95d25f8fea1f80813ab75';

@ProviderFor(objective)
final objectiveProvider = ObjectiveFamily._();

final class ObjectiveProvider
    extends
        $FunctionalProvider<
          AsyncValue<Objective?>,
          Objective?,
          Stream<Objective?>
        >
    with $FutureModifier<Objective?>, $StreamProvider<Objective?> {
  ObjectiveProvider._({
    required ObjectiveFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'objectiveProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$objectiveHash();

  @override
  String toString() {
    return r'objectiveProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $StreamProviderElement<Objective?> $createElement($ProviderPointer pointer) =>
      $StreamProviderElement(pointer);

  @override
  Stream<Objective?> create(Ref ref) {
    final argument = this.argument as String;
    return objective(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is ObjectiveProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$objectiveHash() => r'28dbba29c2e537d4cce9ea5639718d357d9065ed';

final class ObjectiveFamily extends $Family
    with $FunctionalFamilyOverride<Stream<Objective?>, String> {
  ObjectiveFamily._()
    : super(
        retry: null,
        name: r'objectiveProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  ObjectiveProvider call(String id) =>
      ObjectiveProvider._(argument: id, from: this);

  @override
  String toString() => r'objectiveProvider';
}
