// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'goal_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(goalRepository)
final goalRepositoryProvider = GoalRepositoryProvider._();

final class GoalRepositoryProvider
    extends $FunctionalProvider<GoalRepository, GoalRepository, GoalRepository>
    with $Provider<GoalRepository> {
  GoalRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'goalRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$goalRepositoryHash();

  @$internal
  @override
  $ProviderElement<GoalRepository> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  GoalRepository create(Ref ref) {
    return goalRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(GoalRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<GoalRepository>(value),
    );
  }
}

String _$goalRepositoryHash() => r'a9125c7b3bb35388e1bf6f69c1205e3e19fbc35e';

/// All goals, any status, in sort order.

@ProviderFor(goals)
final goalsProvider = GoalsProvider._();

/// All goals, any status, in sort order.

final class GoalsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Goal>>,
          List<Goal>,
          Stream<List<Goal>>
        >
    with $FutureModifier<List<Goal>>, $StreamProvider<List<Goal>> {
  /// All goals, any status, in sort order.
  GoalsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'goalsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$goalsHash();

  @$internal
  @override
  $StreamProviderElement<List<Goal>> $createElement($ProviderPointer pointer) =>
      $StreamProviderElement(pointer);

  @override
  Stream<List<Goal>> create(Ref ref) {
    return goals(ref);
  }
}

String _$goalsHash() => r'71f302ceb94bb61812897048d168cff290b1f31b';

@ProviderFor(goal)
final goalProvider = GoalFamily._();

final class GoalProvider
    extends $FunctionalProvider<AsyncValue<Goal?>, Goal?, Stream<Goal?>>
    with $FutureModifier<Goal?>, $StreamProvider<Goal?> {
  GoalProvider._({
    required GoalFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'goalProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$goalHash();

  @override
  String toString() {
    return r'goalProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $StreamProviderElement<Goal?> $createElement($ProviderPointer pointer) =>
      $StreamProviderElement(pointer);

  @override
  Stream<Goal?> create(Ref ref) {
    final argument = this.argument as String;
    return goal(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is GoalProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$goalHash() => r'2619c05b2f641e68c60f18d274da7c416905719c';

final class GoalFamily extends $Family
    with $FunctionalFamilyOverride<Stream<Goal?>, String> {
  GoalFamily._()
    : super(
        retry: null,
        name: r'goalProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  GoalProvider call(String id) => GoalProvider._(argument: id, from: this);

  @override
  String toString() => r'goalProvider';
}
