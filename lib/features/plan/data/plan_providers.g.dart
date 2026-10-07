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

String _$planOverviewHash() => r'6a144a4a79ca3643075a3ed2e3a2148c7403ca07';

/// The item in Plan's detail pane (visual-design spec, "Two panes on wide
/// screens"); kept while switching tabs.

@ProviderFor(PlanSelection)
final planSelectionProvider = PlanSelectionProvider._();

/// The item in Plan's detail pane (visual-design spec, "Two panes on wide
/// screens"); kept while switching tabs.
final class PlanSelectionProvider
    extends $NotifierProvider<PlanSelection, PlanItem?> {
  /// The item in Plan's detail pane (visual-design spec, "Two panes on wide
  /// screens"); kept while switching tabs.
  PlanSelectionProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'planSelectionProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$planSelectionHash();

  @$internal
  @override
  PlanSelection create() => PlanSelection();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(PlanItem? value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<PlanItem?>(value),
    );
  }
}

String _$planSelectionHash() => r'06cc7003c7fab581b3f8971095ddfe0a98fb24f0';

/// The item in Plan's detail pane (visual-design spec, "Two panes on wide
/// screens"); kept while switching tabs.

abstract class _$PlanSelection extends $Notifier<PlanItem?> {
  PlanItem? build();
  @$mustCallSuper
  @override
  WhenComplete runBuild() {
    final ref = this.ref as $Ref<PlanItem?, PlanItem?>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<PlanItem?, PlanItem?>,
              PlanItem?,
              Object?,
              Object?
            >;
    return element.handleCreate(ref, build);
  }
}

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
