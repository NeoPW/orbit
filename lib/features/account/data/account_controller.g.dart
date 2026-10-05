// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'account_controller.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Supabase Auth when sync is configured, else none. Tests override it.

@ProviderFor(authGateway)
final authGatewayProvider = AuthGatewayProvider._();

/// Supabase Auth when sync is configured, else none. Tests override it.

final class AuthGatewayProvider
    extends $FunctionalProvider<AuthGateway?, AuthGateway?, AuthGateway?>
    with $Provider<AuthGateway?> {
  /// Supabase Auth when sync is configured, else none. Tests override it.
  AuthGatewayProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'authGatewayProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$authGatewayHash();

  @$internal
  @override
  $ProviderElement<AuthGateway?> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  AuthGateway? create(Ref ref) {
    return authGateway(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(AuthGateway? value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<AuthGateway?>(value),
    );
  }
}

String _$authGatewayHash() => r'bddeeb470c273b1cb7145aeb1f310516f5bef382';

/// Sign-in, the first-sign-in rule and sign-out (account and sync specs).

@ProviderFor(Account)
final accountProvider = AccountProvider._();

/// Sign-in, the first-sign-in rule and sign-out (account and sync specs).
final class AccountProvider extends $NotifierProvider<Account, AccountState> {
  /// Sign-in, the first-sign-in rule and sign-out (account and sync specs).
  AccountProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'accountProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$accountHash();

  @$internal
  @override
  Account create() => Account();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(AccountState value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<AccountState>(value),
    );
  }
}

String _$accountHash() => r'1e4e9ca392bafd1ccc65551862c8a4f5404843d5';

/// Sign-in, the first-sign-in rule and sign-out (account and sync specs).

abstract class _$Account extends $Notifier<AccountState> {
  AccountState build();
  @$mustCallSuper
  @override
  WhenComplete runBuild() {
    final ref = this.ref as $Ref<AccountState, AccountState>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<AccountState, AccountState>,
              AccountState,
              Object?,
              Object?
            >;
    return element.handleCreate(ref, build);
  }
}
