import 'dart:async';

import 'package:orbit/features/account/data/auth_gateway.dart';

/// One user with a password; signs in only with the right one.
class FakeAuthGateway implements AuthGateway {
  FakeAuthGateway({
    this.userEmail = 'me@example.com',
    this.password = 'secret',
    this.id = 'user-1',
  });

  final String userEmail;
  final String password;
  final String id;
  bool signedIn = false;
  final _changes = StreamController<void>.broadcast();

  @override
  String? get userId => signedIn ? id : null;

  @override
  String? get email => signedIn ? userEmail : null;

  @override
  Stream<void> get changes => _changes.stream;

  @override
  Future<void> signIn({required String email, required String password}) async {
    if (email.trim() != userEmail || password != this.password) {
      throw const SignInFailure('Wrong email or password');
    }
    signedIn = true;
    _changes.add(null);
  }

  @override
  Future<void> signOut() async {
    signedIn = false;
    _changes.add(null);
  }
}
