import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/db/app_database.dart';
import '../../../core/router/routes.dart';
import '../../../core/widgets/async_body.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/max_width_body.dart';
import '../../key_results/data/key_result_repository.dart';
import '../../projects/data/project_repository.dart';
import '../data/habit_repository.dart';
import '../domain/habit_schedule.dart';
import 'habit_links.dart';

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
        onPressed: () => context.push(Routes.newHabit),
        icon: const Icon(Icons.add),
        label: const Text('New habit'),
      ),
      body: AsyncBody(
        value: ref.watch(habitsProvider),
        data: (habits) => habits.isEmpty
            ? const EmptyState(icon: Icons.repeat, message: 'No habits yet.')
            : MaxWidthBody(
                child: ListView(
                  padding: const EdgeInsets.only(bottom: 88),
                  children: [
                    for (final habit in habits)
                      _HabitTile(
                        habit: habit,
                        links: habitLinkLabel(
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
  final String links;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
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
      onTap: () => context.push(Routes.habit(habit.id)),
      leading: Icon(
        habit.active ? Icons.repeat : Icons.pause_circle_outline,
        color: habit.active ? null : theme.disabledColor,
      ),
      title: Text(
        habit.title,
        style: habit.active ? null : TextStyle(color: theme.disabledColor),
      ),
      subtitle: Text('$links\n$details'),
      isThreeLine: true,
      trailing: habit.active
          ? null
          : const Chip(
              label: Text('Inactive'),
              visualDensity: VisualDensity.compact,
            ),
    );
  }
}
