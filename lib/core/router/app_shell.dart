import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../db/database_providers.dart';

/// Width below which the bottom navigation bar is used instead of the rail.
const compactWidth = 600.0;

class _Destination {
  const _Destination(this.label, this.icon, this.selectedIcon);

  final String label;
  final IconData icon;
  final IconData selectedIcon;
}

/// In the order of the router's branches.
const _destinations = [
  _Destination('Plan', Icons.map_outlined, Icons.map),
  _Destination('Home', Icons.today_outlined, Icons.today),
  _Destination('Review', Icons.insights_outlined, Icons.insights),
];

/// The frame around the three destinations: a bottom navigation bar on
/// narrow screens, a navigation rail on wide ones.
class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.shell});

  final StatefulNavigationShell shell;

  void _select(int index) =>
      shell.goBranch(index, initialLocation: index == shell.currentIndex);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final storageWarning = ref.watch(storageWarningProvider);
    final body = Column(
      children: [
        if (storageWarning) const _StorageWarningBanner(),
        Expanded(child: shell),
      ],
    );

    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth < compactWidth) {
          return Scaffold(
            body: body,
            bottomNavigationBar: NavigationBar(
              selectedIndex: shell.currentIndex,
              onDestinationSelected: _select,
              destinations: [
                for (final d in _destinations)
                  NavigationDestination(
                    icon: Icon(d.icon),
                    selectedIcon: Icon(d.selectedIcon),
                    label: d.label,
                  ),
              ],
            ),
          );
        }
        return Scaffold(
          body: Row(
            children: [
              NavigationRail(
                selectedIndex: shell.currentIndex,
                onDestinationSelected: _select,
                labelType: NavigationRailLabelType.all,
                destinations: [
                  for (final d in _destinations)
                    NavigationRailDestination(
                      icon: Icon(d.icon),
                      selectedIcon: Icon(d.selectedIcon),
                      label: Text(d.label),
                    ),
                ],
              ),
              const VerticalDivider(width: 1),
              Expanded(child: body),
            ],
          ),
        );
      },
    );
  }
}

class _StorageWarningBanner extends StatelessWidget {
  const _StorageWarningBanner();

  @override
  Widget build(BuildContext context) {
    return MaterialBanner(
      leading: const Icon(Icons.warning_amber_outlined),
      content: const Text(
        'This browser offers no persistent storage. Your data is not saved '
        'and will be lost when the page is closed.',
      ),
      actions: [const SizedBox.shrink()],
    );
  }
}
