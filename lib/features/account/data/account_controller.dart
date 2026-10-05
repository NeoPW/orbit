import 'dart:async';

import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:supabase_flutter/supabase_flutter.dart' show Supabase;

import '../../../core/sync/supabase_config.dart';
import '../../../core/sync/sync_providers.dart';
import '../../../core/sync/sync_state.dart';
import 'auth_gateway.dart';

part 'account_controller.g.dart';

/// Supabase Auth when sync is configured, else none. Tests override it.
@Riverpod(keepAlive: true)
AuthGateway? authGateway(Ref ref) => ref.watch(syncConfiguredProvider)
    ? SupabaseAuthGateway(Supabase.instance.client.auth)
    : null;

enum AccountStatus { notConfigured, signedOut, signedIn }

class AccountState {
  const AccountState(this.status, {this.email, this.error, this.busy = false});

  final AccountStatus status;
  final String? email;

  /// The last sign-in problem, shown under the form.
  final String? error;
  final bool busy;
}

/// Sign-in, the first-sign-in rule and sign-out (account and sync specs).
@Riverpod(keepAlive: true)
class Account extends _$Account {
  @override
  AccountState build() {
    final auth = ref.watch(authGatewayProvider);
    if (auth == null) return const AccountState(AccountStatus.notConfigured);
    final subscription = auth.changes.listen((_) => _refresh(auth));
    ref.onDispose(subscription.cancel);
    return _current(auth);
  }

  AccountState _current(AuthGateway auth, {String? error}) =>
      auth.userId == null
      ? AccountState(AccountStatus.signedOut, error: error)
      : AccountState(AccountStatus.signedIn, email: auth.email);

  void _refresh(AuthGateway auth) {
    if (!state.busy) state = _current(auth);
  }

  /// Signs in. On the first sign-in on this device an empty account gets
  /// this device's data; otherwise [confirmReplace] decides whether the
  /// local data is replaced by the account's, or the user is signed out.
  Future<void> signIn({
    required String email,
    required String password,
    required Future<bool> Function() confirmReplace,
  }) async {
    final auth = ref.read(authGatewayProvider)!;
    final service = ref.read(syncServiceProvider);
    final syncState = service.state;
    state = const AccountState(AccountStatus.signedOut, busy: true);
    try {
      await auth.signIn(email: email, password: password);
      final userId = auth.userId!;
      if (await syncState.read(SyncKeys.userId) != userId) {
        final hasData = await ref.read(remoteStoreProvider).hasAnyData();
        if (hasData) {
          if (!await confirmReplace()) {
            await auth.signOut();
            state = _current(auth);
            return;
          }
          await service.engine.wipeLocalData();
        }
        // Without watermarks everything is uploaded (an empty account) or
        // downloaded (after replacing the local data).
        await syncState.clear();
        await syncState.write(SyncKeys.userId, userId);
      }
      state = _current(auth);
      await service.sync();
    } on SignInFailure catch (failure) {
      state = _current(auth, error: failure.message);
    } on Object {
      await auth.signOut();
      state = _current(auth, error: 'Could not reach the server');
    }
  }

  /// Stops syncing; all local data stays on the device.
  Future<void> signOut() async {
    final auth = ref.read(authGatewayProvider)!;
    await auth.signOut();
    await ref.read(syncServiceProvider).state.clear();
    state = _current(auth);
  }
}
