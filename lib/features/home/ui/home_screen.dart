import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/max_width_body.dart';
import '../../../core/widgets/section_heading.dart';
import '../../log/ui/quick_log_sheet.dart';
import '../data/home_providers.dart';
import 'home_habits_section.dart';
import 'home_project_card.dart';
import 'upcoming_deadlines_section.dart';

/// Today: habits due, upcoming deadlines and active projects by score
/// (home spec).
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projects = ref.watch(homeProjectsProvider).value;
    return Scaffold(
      appBar: AppBar(title: const Text('Home')),
      floatingActionButton: FloatingActionButton(
        tooltip: 'Log work',
        onPressed: () => showQuickLog(context),
        child: const Icon(Icons.more_time),
      ),
      body: MaxWidthBody(
        child: ListView(
          // Room for the floating action button.
          padding: const EdgeInsets.only(bottom: 88),
          children: [
            const HomeHabitsSection(),
            const UpcomingDeadlinesSection(),
            const SectionHeading('Active projects'),
            if (projects != null && projects.isEmpty)
              const SectionEmptyText('No active projects'),
            for (final project in projects ?? const <HomeProject>[])
              HomeProjectCard(item: project),
          ],
        ),
      ),
    );
  }
}
