import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'core/router/router.dart';
import 'core/theme/app_theme.dart';

class OrbitApp extends StatefulWidget {
  /// [router] can be passed in tests to start at another location.
  const OrbitApp({super.key, this.router});

  final GoRouter? router;

  @override
  State<OrbitApp> createState() => _OrbitAppState();
}

class _OrbitAppState extends State<OrbitApp> {
  late final GoRouter _router = widget.router ?? createRouter();

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Orbit',
      debugShowCheckedModeBanner: false,
      theme: lightTheme,
      darkTheme: darkTheme,
      themeMode: ThemeMode.system,
      routerConfig: _router,
    );
  }
}
