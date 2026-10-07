import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/time/today.dart';
import '../../../core/widgets/section_heading.dart';
import '../../habits/data/habit_check_repository.dart';
import '../data/home_providers.dart';
import '../domain/home_habits.dart';

/// "Habits due today" as chips; tapping one checks or unchecks it.
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
          const SectionEmptyText('No habits due today', icon: Icons.repeat),
        if (habits != null && habits.isNotEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final item in habits)
                  HabitChip(
                    item: item,
                    onTap: () => item.checkedToday
                        ? checks.uncheck(item.habit.id, today)
                        : checks.check(item.habit, today),
                  ),
              ],
            ),
          ),
      ],
    );
  }
}

/// A habit due today: title, its project or KR, filled when checked.
class HabitChip extends StatelessWidget {
  const HabitChip({super.key, required this.item, required this.onTap});

  final HomeHabit item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final checked = item.checkedToday;
    final label = item.label;
    return Semantics(
      checked: checked,
      button: true,
      label: item.habit.title,
      child: Material(
        color: checked ? colors.secondaryContainer : colors.surfaceContainer,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(
            color: checked ? colors.secondary : colors.outlineVariant,
          ),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(10, 8, 14, 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  checked ? Icons.check_circle : Icons.radio_button_unchecked,
                  size: 20,
                  color: checked ? colors.secondary : colors.outline,
                ),
                const SizedBox(width: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(item.habit.title, style: theme.textTheme.labelLarge),
                    if (label != null)
                      Text(label, style: theme.textTheme.bodySmall),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
