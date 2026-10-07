import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/routes.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/max_width_body.dart';
import '../../../core/widgets/settings_button.dart';
import '../../../core/widgets/two_pane.dart';
import '../../projects/ui/project_detail_screen.dart';
import '../../tasks/ui/task_screen.dart';
import '../../tasks/ui/new_task_sheet.dart';
import '../data/plan_providers.dart';
import 'backlog_tab.dart';
import 'overview_tab.dart';

class PlanScreen extends ConsumerWidget {
  const PlanScreen({super.key});

  /// Not a route: opens the new-task sheet.
  static const _newTask = 'new-task';

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
              ('New task', Icons.task_alt, _newTask),
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
    if (route == null || !context.mounted) return;
    if (route == _newTask) {
      await showNewTaskSheet(context);
    } else {
      await context.push(route);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final list = Column(
      children: [
        // Same width limit as the content below.
        const MaxWidthBody(
          child: TabBar(
            tabs: [
              Tab(text: 'Overview'),
              Tab(text: 'Backlog'),
            ],
          ),
        ),
        const Expanded(
          child: TabBarView(children: [OverviewTab(), BacklogTab()]),
        ),
      ],
    );
    final selection = ref.watch(planSelectionProvider);
    void close() => ref.read(planSelectionProvider.notifier).select(null);

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
              ],
            ),
            const SettingsButton(),
          ],
        ),
        floatingActionButton: FloatingActionButton(
          tooltip: 'Create',
          onPressed: () => _showCreateMenu(context),
          child: const Icon(Icons.add),
        ),
        // The button sits on the list, not on the detail pane.
        floatingActionButtonLocation: TwoPane.isWide(context)
            ? const _ListEndFloat(TwoPane.defaultListWidth)
            : null,
        body: TwoPane(
          list: list,
          detail: switch (selection) {
            null => null,
            PlanProject(:final id) => ProjectDetailScreen(
              key: ValueKey(selection),
              projectId: id,
              onClose: close,
            ),
            PlanTask(:final id) => TaskScreen(
              key: ValueKey(selection),
              taskId: id,
              onClose: close,
            ),
          },
          placeholder: const EmptyState(
            icon: Icons.ads_click,
            message: 'Select a project or task to see it here',
          ),
        ),
      ),
    );
  }
}

/// The bottom-right corner of the list pane.
class _ListEndFloat extends StandardFabLocation
    with FabEndOffsetX, FabFloatOffsetY {
  const _ListEndFloat(this.listWidth);

  final double listWidth;

  @override
  double getOffsetX(
    ScaffoldPrelayoutGeometry scaffoldGeometry,
    double adjustment,
  ) {
    final fromRight = super.getOffsetX(scaffoldGeometry, adjustment);
    return fromRight - (scaffoldGeometry.scaffoldSize.width - listWidth);
  }
}
