import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'supabase_config.g.dart';

/// The Supabase project to sync with, passed at build time with
/// `--dart-define-from-file=supabase.json` (see `supabase.example.json`).
/// Only the publishable (anon) key belongs here, never the secret key.
class SupabaseConfig {
  /// From the build's `--dart-define` values.
  const SupabaseConfig.fromEnvironment()
    : _url = const String.fromEnvironment('SUPABASE_URL'),
      anonKey = const String.fromEnvironment('SUPABASE_ANON_KEY');

  const SupabaseConfig({required this._url, required this.anonKey});

  final String _url;

  /// The project URL (`https://<ref>.supabase.co`). A pasted API endpoint
  /// such as `…/rest/v1/` is cut back to it: the client adds those paths
  /// itself, and the server rejects them twice ("Invalid path specified in
  /// request URL").
  String get url =>
      _url.trim().replaceFirst(RegExp(r'(/(rest|auth)/v1)?/*$'), '');

  final String anonKey;

  /// Without both values the app runs without sync.
  bool get isConfigured => url.isNotEmpty && anonKey.isNotEmpty;
}

@Riverpod(keepAlive: true)
SupabaseConfig supabaseConfig(Ref ref) =>
    const SupabaseConfig.fromEnvironment();

/// Whether this build can sync at all.
@Riverpod(keepAlive: true)
bool syncConfigured(Ref ref) => ref.watch(supabaseConfigProvider).isConfigured;
