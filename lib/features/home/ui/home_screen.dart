import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/animated_items.dart';
import '../../../core/widgets/max_width_body.dart';
import '../../../core/widgets/section_heading.dart';
import '../../../core/widgets/settings_button.dart';
import '../../account/ui/sync_refresh.dart';
import '../../log/ui/quick_log_sheet.dart';
import '../../tasks/ui/new_task_sheet.dart';
import '../data/home_providers.dart';
import 'home_habits_section.dart';
import 'home_project_card.dart';
import 'home_tasks_section.dart';
import 'today_header.dart';
import 'upcoming_deadlines_section.dart';

/// Today, as a dashboard (home spec): header, habits, upcoming deadlines,
/// active projects by score and tasks outside projects, with buttons for a
/// new task (left) and quick log (right).
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projects = ref.watch(homeProjectsProvider).value;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Home'),
        actions: const [SettingsButton()],
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      floatingActionButton: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            FloatingActionButton.extended(
              heroTag: 'new-task',
              tooltip: 'New task',
              onPressed: () => showNewTaskSheet(context),
              icon: const Icon(Icons.add_task),
              label: const Text('Task'),
            ),
            FloatingActionButton.extended(
              heroTag: 'quick-log',
              tooltip: 'Log work',
              onPressed: () => showQuickLog(context),
              icon: const Icon(Icons.more_time),
              label: const Text('Log'),
            ),
          ],
        ),
      ),
      body: MaxWidthBody(
        child: SyncRefresh(
          child: ListView(
            // Room for the two floating buttons.
            padding: const EdgeInsets.only(bottom: 104),
            children: [
              const TodayHeader(),
              const HomeHabitsSection(),
              const UpcomingDeadlinesSection(),
              const SectionHeading('Active projects'),
              if (projects != null && projects.isEmpty)
                const SectionEmptyText(
                  'No active projects',
                  icon: Icons.folder_outlined,
                ),
              AnimatedItems(
                children: [
                  for (final project in projects ?? const <HomeProject>[])
                    HomeProjectCard(
                      key: ValueKey(project.project.id),
                      item: project,
                    ),
                ],
              ),
              const HomeTasksSection(),
            ],
          ),
        ),
      ),
    );
  }
}
