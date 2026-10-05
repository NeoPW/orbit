import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/time/today.dart';
import '../../../core/widgets/section_heading.dart';
import '../../habits/data/habit_check_repository.dart';
import '../data/home_providers.dart';

/// "Habits due today": a checkbox per habit, labeled by project or KR.
class HomeHabitsSection extends ConsumerWidget {
  const HomeHabitsSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final habits = ref.watch(homeHabitsProvider).value;
    final today = ref.watch(todayProvider);
    final checks = ref.read(habitCheckRepositoryProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionHeading('Habits due today'),
        if (habits != null && habits.isEmpty)
          const SectionEmptyText('No habits due today'),
        for (final item in habits ?? const [])
          CheckboxListTile(
            value: item.checkedToday,
            controlAffinity: ListTileControlAffinity.leading,
            title: Text(item.habit.title),
            subtitle: item.label == null ? null : Text(item.label!),
            onChanged: (checked) => checked == true
                ? checks.check(item.habit, today)
                : checks.uncheck(item.habit.id, today),
          ),
      ],
    );
  }
}
