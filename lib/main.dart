import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app.dart';
import 'core/notifications/notification_scheduler.dart';
import 'core/router/routes.dart';
import 'core/sync/supabase_config.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final container = ProviderContainer();
  // Sync only when the build has Supabase values (supabase.json); the
  // session is restored here.
  final config = container.read(supabaseConfigProvider);
  if (config.isConfigured) {
    await Supabase.initialize(url: config.url, publishableKey: config.anonKey);
  }
  final scheduler = container.read(notificationSchedulerProvider);
  await scheduler.init(
    (route) => container.read(notificationTapProvider.notifier).tapped(route),
  );
  // Started by tapping a reminder: open its screen.
  final launchRoute = await scheduler.launchRoute();
  runApp(
    UncontrolledProviderScope(
      container: container,
      child: OrbitApp(initialLocation: launchRoute ?? Routes.home),
    ),
  );
}
