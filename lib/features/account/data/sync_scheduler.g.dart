// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'sync_scheduler.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// How long after the last local change a sync starts.

@ProviderFor(syncDebounce)
final syncDebounceProvider = SyncDebounceProvider._();

/// How long after the last local change a sync starts.

final class SyncDebounceProvider
    extends $FunctionalProvider<Duration, Duration, Duration>
    with $Provider<Duration> {
  /// How long after the last local change a sync starts.
  SyncDebounceProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'syncDebounceProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$syncDebounceHash();

  @$internal
  @override
  $ProviderElement<Duration> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  Duration create(Ref ref) {
    return syncDebounce(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(Duration value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<Duration>(value),
    );
  }
}

String _$syncDebounceHash() => r'96a2a0616b5fdb090a1143c624498ef4ad255fb0';

/// Runs a sync while signed in (sync spec, "When sync runs"): at start and
/// sign-in, on returning to the foreground, a few seconds after changes to
/// synced data, and on demand ([syncNow]: pull-to-refresh, "Sync now").
/// Watched by `SyncScope` while the app runs.

@ProviderFor(SyncScheduler)
final syncSchedulerProvider = SyncSchedulerProvider._();

/// Runs a sync while signed in (sync spec, "When sync runs"): at start and
/// sign-in, on returning to the foreground, a few seconds after changes to
/// synced data, and on demand ([syncNow]: pull-to-refresh, "Sync now").
/// Watched by `SyncScope` while the app runs.
final class SyncSchedulerProvider
    extends $NotifierProvider<SyncScheduler, void> {
  /// Runs a sync while signed in (sync spec, "When sync runs"): at start and
  /// sign-in, on returning to the foreground, a few seconds after changes to
  /// synced data, and on demand ([syncNow]: pull-to-refresh, "Sync now").
  /// Watched by `SyncScope` while the app runs.
  SyncSchedulerProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'syncSchedulerProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$syncSchedulerHash();

  @$internal
  @override
  SyncScheduler create() => SyncScheduler();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(void value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<void>(value),
    );
  }
}

String _$syncSchedulerHash() => r'685f2f7a7a41af26c88eccfbf7012332ccc03423';

/// Runs a sync while signed in (sync spec, "When sync runs"): at start and
/// sign-in, on returning to the foreground, a few seconds after changes to
/// synced data, and on demand ([syncNow]: pull-to-refresh, "Sync now").
/// Watched by `SyncScope` while the app runs.

abstract class _$SyncScheduler extends $Notifier<void> {
  void build();
  @$mustCallSuper
  @override
  WhenComplete runBuild() {
    final ref = this.ref as $Ref<void, void>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<void, void>,
              void,
              Object?,
              Object?
            >;
    return element.handleCreate(ref, build);
  }
}
