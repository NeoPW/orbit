import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'core/notifications/notification_scheduler.dart';
import 'core/router/routes.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final container = ProviderContainer();
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
