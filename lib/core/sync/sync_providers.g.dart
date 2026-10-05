// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'sync_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// The server side of sync. Only used when sync is configured (Supabase is
/// initialized in `main`); tests override it.

@ProviderFor(remoteStore)
final remoteStoreProvider = RemoteStoreProvider._();

/// The server side of sync. Only used when sync is configured (Supabase is
/// initialized in `main`); tests override it.

final class RemoteStoreProvider
    extends $FunctionalProvider<RemoteStore, RemoteStore, RemoteStore>
    with $Provider<RemoteStore> {
  /// The server side of sync. Only used when sync is configured (Supabase is
  /// initialized in `main`); tests override it.
  RemoteStoreProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'remoteStoreProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$remoteStoreHash();

  @$internal
  @override
  $ProviderElement<RemoteStore> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  RemoteStore create(Ref ref) {
    return remoteStore(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(RemoteStore value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<RemoteStore>(value),
    );
  }
}

String _$remoteStoreHash() => r'7a756c1effd6c184a3d5e676fd767945f360e0f1';

@ProviderFor(syncService)
final syncServiceProvider = SyncServiceProvider._();

final class SyncServiceProvider
    extends $FunctionalProvider<SyncService, SyncService, SyncService>
    with $Provider<SyncService> {
  SyncServiceProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'syncServiceProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$syncServiceHash();

  @$internal
  @override
  $ProviderElement<SyncService> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  SyncService create(Ref ref) {
    return syncService(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(SyncService value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<SyncService>(value),
    );
  }
}

String _$syncServiceHash() => r'5dda3d835f1617f5358880f5c7db66ff99fb6901';

/// Last successful sync, last failure and the device's account.

@ProviderFor(syncStatus)
final syncStatusProvider = SyncStatusProvider._();

/// Last successful sync, last failure and the device's account.

final class SyncStatusProvider
    extends
        $FunctionalProvider<
          AsyncValue<SyncStatus>,
          SyncStatus,
          Stream<SyncStatus>
        >
    with $FutureModifier<SyncStatus>, $StreamProvider<SyncStatus> {
  /// Last successful sync, last failure and the device's account.
  SyncStatusProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'syncStatusProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$syncStatusHash();

  @$internal
  @override
  $StreamProviderElement<SyncStatus> $createElement($ProviderPointer pointer) =>
      $StreamProviderElement(pointer);

  @override
  Stream<SyncStatus> create(Ref ref) {
    return syncStatus(ref);
  }
}

String _$syncStatusHash() => r'2e21e64dbf72796ed93bf3ef605865f788179fba';
