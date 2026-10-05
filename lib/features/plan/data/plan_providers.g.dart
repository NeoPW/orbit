// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'plan_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// The Overview tab, updated after every relevant write.

@ProviderFor(planOverview)
final planOverviewProvider = PlanOverviewProvider._();

/// The Overview tab, updated after every relevant write.

final class PlanOverviewProvider
    extends
        $FunctionalProvider<
          AsyncValue<PlanOverview>,
          AsyncValue<PlanOverview>,
          AsyncValue<PlanOverview>
        >
    with $Provider<AsyncValue<PlanOverview>> {
  /// The Overview tab, updated after every relevant write.
  PlanOverviewProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'planOverviewProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$planOverviewHash();

  @$internal
  @override
  $ProviderElement<AsyncValue<PlanOverview>> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  AsyncValue<PlanOverview> create(Ref ref) {
    return planOverview(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(AsyncValue<PlanOverview> value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<AsyncValue<PlanOverview>>(value),
    );
  }
}

String _$planOverviewHash() => r'39dc3e68bbcec95ff3e93a7e5c44f14d37ec7c02';

/// Completed/archived objectives and completed projects, most recently
/// updated first.

@ProviderFor(archive)
final archiveProvider = ArchiveProvider._();

/// Completed/archived objectives and completed projects, most recently
/// updated first.

final class ArchiveProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<ArchiveItem>>,
          AsyncValue<List<ArchiveItem>>,
          AsyncValue<List<ArchiveItem>>
        >
    with $Provider<AsyncValue<List<ArchiveItem>>> {
  /// Completed/archived objectives and completed projects, most recently
  /// updated first.
  ArchiveProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'archiveProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$archiveHash();

  @$internal
  @override
  $ProviderElement<AsyncValue<List<ArchiveItem>>> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  AsyncValue<List<ArchiveItem>> create(Ref ref) {
    return archive(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(AsyncValue<List<ArchiveItem>> value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<AsyncValue<List<ArchiveItem>>>(
        value,
      ),
    );
  }
}

String _$archiveHash() => r'e1a77205215c51fe8af5e997a07c33c29e4ed211';
