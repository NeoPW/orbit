import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/sync/sync_providers.dart';
import 'package:orbit/core/sync/sync_state.dart';
import 'package:orbit/features/account/data/account_controller.dart';

import '../../../helpers/fake_auth.dart';
import '../../../helpers/fake_remote_store.dart';
import '../../../helpers/provider_container.dart';
import '../../../helpers/sync_device.dart';

void main() {
  late FakeRemoteStore remote;
  late FakeAuthGateway auth;
  late SyncDevice device;
  late ProviderContainer container;

  setUp(() {
    remote = FakeRemoteStore();
    auth = FakeAuthGateway();
    device = SyncDevice(remote);
    container = containerWith(
      device.db,
      overrides: [
        authGatewayProvider.overrideWithValue(auth),
        remoteStoreProvider.overrideWithValue(remote),
      ],
    );
  });
  tearDown(() async {
    container.dispose();
    await device.close();
  });

  Account account() => container.read(accountProvider.notifier);
  AccountState state() => container.read(accountProvider);
  Future<List<String>> projectTitles() async => [
    for (final row in await device.raw('projects')) row['title']! as String,
  ];

  Future<void> signIn({
    String password = 'secret',
    bool confirm = true,
    List<bool>? asked,
  }) => account().signIn(
    email: 'me@example.com',
    password: password,
    confirmReplace: () async {
      asked?.add(true);
      return confirm;
    },
  );

  /// The account already has data from another device.
  Future<void> accountWithData() async {
    final other = SyncDevice(remote);
    addTearDown(other.close);
    await other.signIn();
    await other.projects.create(title: 'From the phone');
    await other.sync();
  }

  test('starts signed out', () {
    expect(state().status, AccountStatus.signedOut);
  });

  test('an empty account gets this device\'s data', () async {
    await device.projects.create(title: 'Thesis');
    final asked = <bool>[];
    await signIn(asked: asked);

    expect(asked, isEmpty);
    expect(state().status, AccountStatus.signedIn);
    expect(state().email, 'me@example.com');
    expect(remote.rows('projects').map((r) => r['title']), ['Thesis']);
    expect(await device.engine.state.read(SyncKeys.userId), 'user-1');
  });

  test('an account with data replaces local data after confirming', () async {
    await accountWithData();
    await device.projects.create(title: 'Browser test data');
    final asked = <bool>[];
    await signIn(asked: asked);

    expect(asked, [true]);
    expect(await projectTitles(), ['From the phone']);
    expect(
      remote.rows('projects').map((r) => r['title']),
      isNot(contains('Browser test data')),
    );
    // The local default areas were replaced by the account's.
    expect((await device.raw('areas')).length, remote.rows('areas').length);
  });

  test('cancelling signs out and keeps local data', () async {
    await accountWithData();
    await device.projects.create(title: 'Browser test data');
    await signIn(confirm: false);

    expect(state().status, AccountStatus.signedOut);
    expect(auth.signedIn, isFalse);
    expect(await projectTitles(), ['Browser test data']);
    expect(await device.engine.state.read(SyncKeys.userId), isNull);
  });

  test('a returning user keeps local data and syncs', () async {
    await signIn();
    await account().signOut();
    await device.engine.state.write(SyncKeys.userId, 'user-1');
    await device.projects.create(title: 'Made offline');
    final asked = <bool>[];
    await signIn(asked: asked);

    expect(asked, isEmpty);
    expect(
      remote.rows('projects').map((r) => r['title']),
      contains('Made offline'),
    );
  });

  test('a wrong password shows an error and stays signed out', () async {
    await signIn(password: 'nope');
    expect(state().status, AccountStatus.signedOut);
    expect(state().error, 'Wrong email or password');
  });

  test('without a server the sign-in is undone', () async {
    remote.failWith = Exception('offline');
    await signIn();
    expect(state().status, AccountStatus.signedOut);
    expect(state().error, 'Could not reach the server');
  });

  test('signing out keeps local data and forgets the account', () async {
    await device.projects.create(title: 'Thesis');
    await signIn();
    await account().signOut();

    expect(state().status, AccountStatus.signedOut);
    expect(await projectTitles(), ['Thesis']);
    expect(await device.engine.state.read(SyncKeys.userId), isNull);
  });

  test('without Supabase values the account is not configured', () {
    final unconfigured = containerWith(
      device.db,
      overrides: [authGatewayProvider.overrideWithValue(null)],
    );
    addTearDown(unconfigured.dispose);
    expect(
      unconfigured.read(accountProvider).status,
      AccountStatus.notConfigured,
    );
  });
}
