import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/sync/remote_store.dart';
import 'package:orbit/core/sync/supabase_remote_store.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

void main() {
  test('can be constructed without a network', () {
    final client = SupabaseClient('https://example.supabase.co', 'key');
    addTearDown(client.dispose);
    final RemoteStore store = SupabaseRemoteStore(
      client,
      tables: const ['areas'],
    );
    expect(store, isA<SupabaseRemoteStore>());
  });
}
