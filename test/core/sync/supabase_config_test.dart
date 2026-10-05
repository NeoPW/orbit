import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/sync/supabase_config.dart';

void main() {
  test('without values sync is not configured', () {
    expect(const SupabaseConfig(url: '', anonKey: '').isConfigured, isFalse);
    expect(
      const SupabaseConfig(
        url: 'https://x.supabase.co',
        anonKey: '',
      ).isConfigured,
      isFalse,
    );
    // Tests run without --dart-define values.
    expect(const SupabaseConfig.fromEnvironment().isConfigured, isFalse);
  });

  test('with URL and key sync is configured', () {
    expect(
      const SupabaseConfig(
        url: 'https://x.supabase.co',
        anonKey: 'key',
      ).isConfigured,
      isTrue,
    );
  });

  test('a pasted API endpoint is cut back to the project URL', () {
    for (final url in [
      'https://abc.supabase.co',
      'https://abc.supabase.co/',
      'https://abc.supabase.co/rest/v1/',
      'https://abc.supabase.co/rest/v1',
      ' https://abc.supabase.co/auth/v1 ',
    ]) {
      expect(
        SupabaseConfig(url: url, anonKey: 'key').url,
        'https://abc.supabase.co',
        reason: url,
      );
    }
  });
}
