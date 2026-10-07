import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/db/app_database.dart';
import '../../../core/widgets/async_body.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/max_width_body.dart';
import '../../../core/widgets/orbit_chips.dart';
import '../../key_results/data/key_result_repository.dart';
import '../../projects/data/project_repository.dart';
import '../data/habit_repository.dart';
import '../domain/habit_schedule.dart';
import 'habit_links.dart';
import 'habit_form.dart';

class HabitsScreen extends ConsumerWidget {
  const HabitsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projects = {
      for (final p in ref.watch(allProjectsProvider).value ?? <Project>[])
        p.id: p,
    };
    final keyResults = {
      for (final k in ref.watch(keyResultsProvider).value ?? <KeyResult>[])
        k.id: k,
    };

    return Scaffold(
      appBar: AppBar(title: const Text('Habits')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showHabitForm(context),
        icon: const Icon(Icons.add),
        label: const Text('New habit'),
      ),
      body: AsyncBody(
        value: ref.watch(habitsProvider),
        data: (habits) => habits.isEmpty
            ? EmptyState(
                icon: Icons.repeat,
                message: 'No habits yet',
                action: FilledButton.tonal(
                  onPressed: () => showHabitForm(context),
                  child: const Text('New habit'),
                ),
              )
            : MaxWidthBody(
                child: ListView(
                  padding: const EdgeInsets.only(bottom: 88),
                  children: [
                    for (final habit in habits)
                      _HabitTile(
                        habit: habit,
                        links: habitLinks(
                          habit,
                          projects: projects,
                          keyResults: keyResults,
                        ),
                      ),
                  ],
                ),
              ),
      ),
    );
  }
}

class _HabitTile extends StatelessWidget {
  const _HabitTile({required this.habit, required this.links});

  final Habit habit;
  final List<({IconData icon, String title})> links;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final muted = theme.colorScheme.onSurfaceVariant;
    final reminder = habit.reminderTime;
    final details = [
      scheduleSummary(
        habit.scheduleType,
        weekdays: habit.weekdays,
        timesPerWeek: habit.timesPerWeek,
      ),
      if (reminder != null) 'Reminder $reminder',
    ].join(' · ');

    return ListTile(
      onTap: () => showHabitForm(context, habitId: habit.id),
      leading: Icon(
        habit.active ? Icons.repeat : Icons.pause_circle_outline,
        color: habit.active ? theme.colorScheme.primary : muted,
      ),
      title: Text(
        habit.title,
        style: habit.active ? null : TextStyle(color: muted),
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(details),
          if (links.isNotEmpty) ...[
            const SizedBox(height: 4),
            Wrap(
              spacing: 12,
              runSpacing: 2,
              children: [
                for (final link in links)
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(link.icon, size: 14, color: muted),
                      const SizedBox(width: 4),
                      Text(link.title),
                    ],
                  ),
              ],
            ),
          ],
        ],
      ),
      trailing: habit.active
          ? null
          : StatusChip<void>(label: 'Inactive', color: muted),
    );
  }
}
