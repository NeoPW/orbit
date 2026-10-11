import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/empty_state.dart';
import '../data/measure_repository.dart';
import 'goal_screen.dart';

/// The former address of a key result: shows the page of the goal its
/// measure belongs to (app-shell spec, "Former objective and key result
/// addresses"), or that the goal was not found.
class MeasureRedirectScreen extends ConsumerWidget {
  const MeasureRedirectScreen({super.key, required this.measureId});

  final String measureId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final measure = ref.watch(measureProvider(measureId));
    return switch (measure) {
      AsyncData(value: final m?) => GoalScreen(goalId: m.goalId),
      AsyncData() || AsyncError() => Scaffold(
        appBar: AppBar(title: const Text('Goal')),
        body: const EmptyState(
          icon: Icons.search_off,
          message: 'Goal not found',
        ),
      ),
      _ => const Scaffold(body: Center(child: CircularProgressIndicator())),
    };
  }
}
