// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'supabase_config.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(supabaseConfig)
final supabaseConfigProvider = SupabaseConfigProvider._();

final class SupabaseConfigProvider
    extends $FunctionalProvider<SupabaseConfig, SupabaseConfig, SupabaseConfig>
    with $Provider<SupabaseConfig> {
  SupabaseConfigProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'supabaseConfigProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$supabaseConfigHash();

  @$internal
  @override
  $ProviderElement<SupabaseConfig> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  SupabaseConfig create(Ref ref) {
    return supabaseConfig(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(SupabaseConfig value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<SupabaseConfig>(value),
    );
  }
}

String _$supabaseConfigHash() => r'66e3ff0dd2a7082cdfcdd73d30b72d6841454b40';

/// Whether this build can sync at all.

@ProviderFor(syncConfigured)
final syncConfiguredProvider = SyncConfiguredProvider._();

/// Whether this build can sync at all.

final class SyncConfiguredProvider extends $FunctionalProvider<bool, bool, bool>
    with $Provider<bool> {
  /// Whether this build can sync at all.
  SyncConfiguredProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'syncConfiguredProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$syncConfiguredHash();

  @$internal
  @override
  $ProviderElement<bool> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  bool create(Ref ref) {
    return syncConfigured(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(bool value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<bool>(value),
    );
  }
}

String _$syncConfiguredHash() => r'e1436f33b2bc16cd8edaf3c53db38d040675e935';
