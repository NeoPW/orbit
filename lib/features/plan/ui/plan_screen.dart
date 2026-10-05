import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/routes.dart';
import '../../../core/widgets/max_width_body.dart';
import 'backlog_tab.dart';
import 'overview_tab.dart';

class PlanScreen extends StatelessWidget {
  const PlanScreen({super.key});

  Future<void> _showCreateMenu(BuildContext context) async {
    final route = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final (label, icon, route) in [
              ('New objective', Icons.flag_outlined, Routes.newObjective),
              ('New project', Icons.folder_outlined, Routes.newProject),
              ('New habit', Icons.repeat, Routes.newHabit),
            ])
              ListTile(
                leading: Icon(icon),
                title: Text(label),
                onTap: () => Navigator.of(context).pop(route),
              ),
          ],
        ),
      ),
    );
    if (route != null && context.mounted) context.push(route);
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Plan'),
          actions: [
            PopupMenuButton<String>(
              tooltip: 'More',
              onSelected: (route) => context.push(route),
              itemBuilder: (context) => const [
                PopupMenuItem(value: Routes.archive, child: Text('Archive')),
                PopupMenuItem(value: Routes.habits, child: Text('Habits')),
                PopupMenuItem(value: Routes.areas, child: Text('Areas')),
                PopupMenuItem(value: Routes.settings, child: Text('Settings')),
              ],
            ),
          ],
          bottom: const PreferredSize(
            preferredSize: Size.fromHeight(kTextTabBarHeight),
            // Same width limit as the content below.
            child: MaxWidthBody(
              child: TabBar(
                tabs: [
                  Tab(text: 'Overview'),
                  Tab(text: 'Backlog'),
                ],
              ),
            ),
          ),
        ),
        floatingActionButton: FloatingActionButton(
          tooltip: 'Create',
          onPressed: () => _showCreateMenu(context),
          child: const Icon(Icons.add),
        ),
        body: const TabBarView(children: [OverviewTab(), BacklogTab()]),
      ),
    );
  }
}
