import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/max_width_body.dart';
import '../../../core/widgets/settings_button.dart';
import '../../../core/widgets/two_pane.dart';
import '../../projects/ui/project_detail_screen.dart';
import '../../tasks/ui/task_screen.dart';
import '../../objectives/ui/objective_form.dart';
import '../../projects/ui/project_form.dart';
import '../../tasks/ui/task_form.dart';
import '../data/plan_providers.dart';
import 'backlog_tab.dart';
import 'more_sheet.dart';
import 'overview_tab.dart';
import '../../habits/ui/habit_form.dart';
import '../../key_results/ui/key_result_screen.dart';
import '../../objectives/ui/objective_screen.dart';

class PlanScreen extends ConsumerWidget {
  const PlanScreen({super.key});

  Future<void> _showCreateMenu(BuildContext context) async {
    final create = await showModalBottomSheet<Future<void> Function()>(
      context: context,
      showDragHandle: true,
      builder: (sheetContext) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final (label, icon, open)
                in <(String, IconData, Future<void> Function())>[
                  (
                    'New objective',
                    Icons.flag_outlined,
                    () => showObjectiveForm(context),
                  ),
                  (
                    'New project',
                    Icons.folder_outlined,
                    () => showProjectForm(context),
                  ),
                  ('New task', Icons.task_alt, () => showTaskForm(context)),
                  ('New habit', Icons.repeat, () => showHabitForm(context)),
                ])
              ListTile(
                leading: Icon(icon),
                title: Text(label),
                onTap: () => Navigator.of(sheetContext).pop(open),
              ),
          ],
        ),
      ),
    );
    if (create != null && context.mounted) await create();
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
            IconButton(
              tooltip: 'More',
              icon: const Icon(Icons.apps),
              onPressed: () => showMoreSheet(context),
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
            PlanObjective(:final id) => ObjectiveScreen(
              key: ValueKey(selection),
              objectiveId: id,
              onClose: close,
            ),
            PlanKeyResult(:final id) => KeyResultScreen(
              key: ValueKey(selection),
              keyResultId: id,
              onClose: close,
            ),
          },
          placeholder: const EmptyState(
            icon: Icons.ads_click,
            message: 'Select an item to see it here',
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
