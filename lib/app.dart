import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/notifications/notification_scheduler.dart';
import 'core/router/router.dart';
import 'core/router/routes.dart';
import 'core/theme/app_theme.dart';
import 'features/account/ui/sync_scope.dart';
import 'features/reminders/ui/reminder_sync_scope.dart';

class OrbitApp extends ConsumerStatefulWidget {
  /// [router] can be passed in tests to start at another location;
  /// otherwise the app starts at [initialLocation] (e.g. the screen of the
  /// reminder that launched it).
  const OrbitApp({super.key, this.router, this.initialLocation = Routes.home});

  final GoRouter? router;
  final String initialLocation;

  @override
  ConsumerState<OrbitApp> createState() => _OrbitAppState();
}

class _OrbitAppState extends ConsumerState<OrbitApp> {
  late final GoRouter _router =
      widget.router ?? createRouter(initialLocation: widget.initialLocation);

  @override
  Widget build(BuildContext context) {
    // A reminder tapped while the app runs: Home replaces the current tab,
    // other screens open on top so back returns to where the user was.
    ref.listen(notificationTapProvider, (_, tap) {
      if (tap == null) return;
      if (tap.route == Routes.home) {
        _router.go(tap.route);
      } else {
        _router.push(tap.route);
      }
    });
    return MaterialApp.router(
      title: 'Orbit',
      debugShowCheckedModeBanner: false,
      theme: lightTheme,
      darkTheme: darkTheme,
      themeMode: ThemeMode.system,
      routerConfig: _router,
      builder: (context, child) =>
          ReminderSyncScope(child: SyncScope(child: child!)),
    );
  }
}
