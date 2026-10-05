import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/sync/sync_providers.dart';
import 'package:orbit/features/account/data/account_controller.dart';
import 'package:orbit/features/account/data/sync_scheduler.dart';

import '../../../helpers/fake_auth.dart';
import '../../../helpers/fake_sync_service.dart';
import '../../../helpers/provider_container.dart';
import '../../../helpers/repos.dart';

void main() {
  // The scheduler listens to the app lifecycle.
  TestWidgetsFlutterBinding.ensureInitialized();

  const debounce = Duration(milliseconds: 100);
  late Repos r;
  late FakeAuthGateway auth;
  late FakeSyncService service;

  setUp(() async {
    r = Repos();
    // Open (and seed) the database first: seeding counts as a change.
    await r.db.select(r.db.areas).get();
    auth = FakeAuthGateway()..signedIn = true;
    service = FakeSyncService();
  });
  tearDown(() => r.close());

  ProviderContainer start() {
    final container = containerWith(
      r.db,
      overrides: [
        authGatewayProvider.overrideWithValue(auth),
        syncServiceProvider.overrideWithValue(service),
        syncDebounceProvider.overrideWithValue(debounce),
      ],
    );
    addTearDown(container.dispose);
    container.listen(syncSchedulerProvider, (_, _) {});
    return container;
  }

  Future<void> settle() => Future<void>.delayed(debounce * 3);

  test('syncs at start when signed in', () async {
    start();
    await settle();
    expect(service.calls, 1);
  });

  test('a local change triggers one debounced sync', () async {
    start();
    await settle();
    await r.projects.create(title: 'A');
    await r.projects.create(title: 'B');
    await settle();
    expect(service.calls, 2);
  });

  test('writes during a sync trigger nothing', () async {
    start();
    await settle();
    service.running = true;
    await r.projects.create(title: 'Pulled');
    await settle();
    expect(service.calls, 1);
  });

  test('settings changes trigger nothing', () async {
    start();
    await settle();
    await r.db
        .into(r.db.settings)
        .insertOnConflictUpdate(
          SettingsCompanion.insert(key: 'deadline_lead_days', value: '3'),
        );
    await settle();
    expect(service.calls, 1);
  });

  test('signed out: no syncs', () async {
    auth.signedIn = false;
    final container = start();
    await r.projects.create(title: 'A');
    await settle();
    await container.read(syncSchedulerProvider.notifier).syncNow();
    expect(service.calls, 0);
  });
}
