// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'area_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(areaRepository)
final areaRepositoryProvider = AreaRepositoryProvider._();

final class AreaRepositoryProvider
    extends $FunctionalProvider<AreaRepository, AreaRepository, AreaRepository>
    with $Provider<AreaRepository> {
  AreaRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'areaRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$areaRepositoryHash();

  @$internal
  @override
  $ProviderElement<AreaRepository> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  AreaRepository create(Ref ref) {
    return areaRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(AreaRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<AreaRepository>(value),
    );
  }
}

String _$areaRepositoryHash() => r'e4bb865cab7a09419b7da34ff32ac8b92fcf4c53';

/// All areas in sort order.

@ProviderFor(areas)
final areasProvider = AreasProvider._();

/// All areas in sort order.

final class AreasProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Area>>,
          List<Area>,
          Stream<List<Area>>
        >
    with $FutureModifier<List<Area>>, $StreamProvider<List<Area>> {
  /// All areas in sort order.
  AreasProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'areasProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$areasHash();

  @$internal
  @override
  $StreamProviderElement<List<Area>> $createElement($ProviderPointer pointer) =>
      $StreamProviderElement(pointer);

  @override
  Stream<List<Area>> create(Ref ref) {
    return areas(ref);
  }
}

String _$areasHash() => r'b3c3694abe108f0c94900074dace55017ea0cea0';
