import 'dart:async';

import 'package:supabase_flutter/supabase_flutter.dart';

/// Why signing in did not work, in words for the user.
class SignInFailure implements Exception {
  const SignInFailure(this.message);

  final String message;

  @override
  String toString() => message;
}

/// Email and password sign-in (account spec). Implemented with Supabase
/// Auth; tests use a fake.
abstract interface class AuthGateway {
  String? get userId;
  String? get email;

  /// Emits whenever the user signs in or out or the session ends.
  Stream<void> get changes;

  /// Throws [SignInFailure].
  Future<void> signIn({required String email, required String password});
  Future<void> signOut();
}

class SupabaseAuthGateway implements AuthGateway {
  SupabaseAuthGateway(this.auth);

  final GoTrueClient auth;

  @override
  String? get userId => auth.currentUser?.id;

  @override
  String? get email => auth.currentUser?.email;

  @override
  Stream<void> get changes => auth.onAuthStateChange.map((_) {});

  @override
  Future<void> signIn({required String email, required String password}) async {
    try {
      await auth.signInWithPassword(email: email.trim(), password: password);
    } on AuthException catch (error) {
      throw SignInFailure(
        error.code == 'invalid_credentials'
            ? 'Wrong email or password'
            : 'Sign-in failed: ${error.message}',
      );
    } on Object {
      throw const SignInFailure('Could not reach the server');
    }
  }

  @override
  Future<void> signOut() => auth.signOut();
}
