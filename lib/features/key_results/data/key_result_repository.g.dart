// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'key_result_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(keyResultRepository)
final keyResultRepositoryProvider = KeyResultRepositoryProvider._();

final class KeyResultRepositoryProvider
    extends
        $FunctionalProvider<
          KeyResultRepository,
          KeyResultRepository,
          KeyResultRepository
        >
    with $Provider<KeyResultRepository> {
  KeyResultRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'keyResultRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$keyResultRepositoryHash();

  @$internal
  @override
  $ProviderElement<KeyResultRepository> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  KeyResultRepository create(Ref ref) {
    return keyResultRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(KeyResultRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<KeyResultRepository>(value),
    );
  }
}

String _$keyResultRepositoryHash() =>
    r'01b84c8db47aa55876aa2718a22100efb7c7720c';

/// All KRs of all objectives, in sort order.

@ProviderFor(keyResults)
final keyResultsProvider = KeyResultsProvider._();

/// All KRs of all objectives, in sort order.

final class KeyResultsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<KeyResult>>,
          List<KeyResult>,
          Stream<List<KeyResult>>
        >
    with $FutureModifier<List<KeyResult>>, $StreamProvider<List<KeyResult>> {
  /// All KRs of all objectives, in sort order.
  KeyResultsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'keyResultsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$keyResultsHash();

  @$internal
  @override
  $StreamProviderElement<List<KeyResult>> $createElement(
    $ProviderPointer pointer,
  ) => $StreamProviderElement(pointer);

  @override
  Stream<List<KeyResult>> create(Ref ref) {
    return keyResults(ref);
  }
}

String _$keyResultsHash() => r'ac81ff80eddabf9f994cbc0533d772daa8555b46';

@ProviderFor(keyResult)
final keyResultProvider = KeyResultFamily._();

final class KeyResultProvider
    extends
        $FunctionalProvider<
          AsyncValue<KeyResult?>,
          KeyResult?,
          Stream<KeyResult?>
        >
    with $FutureModifier<KeyResult?>, $StreamProvider<KeyResult?> {
  KeyResultProvider._({
    required KeyResultFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'keyResultProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$keyResultHash();

  @override
  String toString() {
    return r'keyResultProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $StreamProviderElement<KeyResult?> $createElement($ProviderPointer pointer) =>
      $StreamProviderElement(pointer);

  @override
  Stream<KeyResult?> create(Ref ref) {
    final argument = this.argument as String;
    return keyResult(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is KeyResultProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$keyResultHash() => r'ba8ffe96d48d6749c782f52692936a8bc04d7614';

final class KeyResultFamily extends $Family
    with $FunctionalFamilyOverride<Stream<KeyResult?>, String> {
  KeyResultFamily._()
    : super(
        retry: null,
        name: r'keyResultProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  KeyResultProvider call(String id) =>
      KeyResultProvider._(argument: id, from: this);

  @override
  String toString() => r'keyResultProvider';
}

/// Check-ins counted towards each habit KR, by KR ID.

@ProviderFor(habitCheckIns)
final habitCheckInsProvider = HabitCheckInsProvider._();

/// Check-ins counted towards each habit KR, by KR ID.

final class HabitCheckInsProvider
    extends
        $FunctionalProvider<
          AsyncValue<Map<String, int>>,
          Map<String, int>,
          Stream<Map<String, int>>
        >
    with $FutureModifier<Map<String, int>>, $StreamProvider<Map<String, int>> {
  /// Check-ins counted towards each habit KR, by KR ID.
  HabitCheckInsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'habitCheckInsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$habitCheckInsHash();

  @$internal
  @override
  $StreamProviderElement<Map<String, int>> $createElement(
    $ProviderPointer pointer,
  ) => $StreamProviderElement(pointer);

  @override
  Stream<Map<String, int>> create(Ref ref) {
    return habitCheckIns(ref);
  }
}

String _$habitCheckInsHash() => r'7968174157ae5261e53caa1cfd2160adca6d199d';
