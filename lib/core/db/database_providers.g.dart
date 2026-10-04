// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'database_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Whether the database runs in memory because the browser offers no
/// persistent storage. The shell shows a warning banner while true.

@ProviderFor(StorageWarning)
final storageWarningProvider = StorageWarningProvider._();

/// Whether the database runs in memory because the browser offers no
/// persistent storage. The shell shows a warning banner while true.
final class StorageWarningProvider
    extends $NotifierProvider<StorageWarning, bool> {
  /// Whether the database runs in memory because the browser offers no
  /// persistent storage. The shell shows a warning banner while true.
  StorageWarningProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'storageWarningProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$storageWarningHash();

  @$internal
  @override
  StorageWarning create() => StorageWarning();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(bool value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<bool>(value),
    );
  }
}

String _$storageWarningHash() => r'917d4fae92bab99d2eb4f594d388d5cfb47b2ae8';

/// Whether the database runs in memory because the browser offers no
/// persistent storage. The shell shows a warning banner while true.

abstract class _$StorageWarning extends $Notifier<bool> {
  bool build();
  @$mustCallSuper
  @override
  WhenComplete runBuild() {
    final ref = this.ref as $Ref<bool, bool>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<bool, bool>,
              bool,
              Object?,
              Object?
            >;
    return element.handleCreate(ref, build);
  }
}

/// The app database. Tests override this with an in-memory database.

@ProviderFor(appDatabase)
final appDatabaseProvider = AppDatabaseProvider._();

/// The app database. Tests override this with an in-memory database.

final class AppDatabaseProvider
    extends $FunctionalProvider<AppDatabase, AppDatabase, AppDatabase>
    with $Provider<AppDatabase> {
  /// The app database. Tests override this with an in-memory database.
  AppDatabaseProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'appDatabaseProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$appDatabaseHash();

  @$internal
  @override
  $ProviderElement<AppDatabase> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  AppDatabase create(Ref ref) {
    return appDatabase(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(AppDatabase value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<AppDatabase>(value),
    );
  }
}

String _$appDatabaseHash() => r'9edbd7ae35ff13514a1561b2cb936c042c05b0cd';
