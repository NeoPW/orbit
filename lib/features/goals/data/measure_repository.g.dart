// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'measure_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(measureRepository)
final measureRepositoryProvider = MeasureRepositoryProvider._();

final class MeasureRepositoryProvider
    extends
        $FunctionalProvider<
          MeasureRepository,
          MeasureRepository,
          MeasureRepository
        >
    with $Provider<MeasureRepository> {
  MeasureRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'measureRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$measureRepositoryHash();

  @$internal
  @override
  $ProviderElement<MeasureRepository> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  MeasureRepository create(Ref ref) {
    return measureRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(MeasureRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<MeasureRepository>(value),
    );
  }
}

String _$measureRepositoryHash() => r'c47d06526bf6f975b6e10c89da57ee2fd47321b4';

/// All measures of all goals, in sort order.

@ProviderFor(measures)
final measuresProvider = MeasuresProvider._();

/// All measures of all goals, in sort order.

final class MeasuresProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Measure>>,
          List<Measure>,
          Stream<List<Measure>>
        >
    with $FutureModifier<List<Measure>>, $StreamProvider<List<Measure>> {
  /// All measures of all goals, in sort order.
  MeasuresProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'measuresProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$measuresHash();

  @$internal
  @override
  $StreamProviderElement<List<Measure>> $createElement(
    $ProviderPointer pointer,
  ) => $StreamProviderElement(pointer);

  @override
  Stream<List<Measure>> create(Ref ref) {
    return measures(ref);
  }
}

String _$measuresHash() => r'e24d44937bb300814c62ea5c17212c4475bf84dd';

@ProviderFor(measure)
final measureProvider = MeasureFamily._();

final class MeasureProvider
    extends
        $FunctionalProvider<AsyncValue<Measure?>, Measure?, Stream<Measure?>>
    with $FutureModifier<Measure?>, $StreamProvider<Measure?> {
  MeasureProvider._({
    required MeasureFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'measureProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$measureHash();

  @override
  String toString() {
    return r'measureProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $StreamProviderElement<Measure?> $createElement($ProviderPointer pointer) =>
      $StreamProviderElement(pointer);

  @override
  Stream<Measure?> create(Ref ref) {
    final argument = this.argument as String;
    return measure(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is MeasureProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$measureHash() => r'23f3d3b0a9d30bbfaac574528b7ea26014be2d57';

final class MeasureFamily extends $Family
    with $FunctionalFamilyOverride<Stream<Measure?>, String> {
  MeasureFamily._()
    : super(
        retry: null,
        name: r'measureProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  MeasureProvider call(String id) =>
      MeasureProvider._(argument: id, from: this);

  @override
  String toString() => r'measureProvider';
}

/// Check-ins counted towards each habit measure, by measure ID.

@ProviderFor(habitCheckIns)
final habitCheckInsProvider = HabitCheckInsProvider._();

/// Check-ins counted towards each habit measure, by measure ID.

final class HabitCheckInsProvider
    extends
        $FunctionalProvider<
          AsyncValue<Map<String, int>>,
          Map<String, int>,
          Stream<Map<String, int>>
        >
    with $FutureModifier<Map<String, int>>, $StreamProvider<Map<String, int>> {
  /// Check-ins counted towards each habit measure, by measure ID.
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

String _$habitCheckInsHash() => r'c4031fddd6126e9bf88bcc64c787c688829c9774';
