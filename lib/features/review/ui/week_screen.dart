import 'package:flutter/material.dart';

import '../../../core/time/calendar_date.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/max_width_body.dart';
import 'week_format.dart';
import 'week_summary_view.dart';

/// The summary of one week (weekly-review spec, "Last week page").
/// [weekStart] is the ISO date from the URL; any day of the week works.
class WeekScreen extends StatelessWidget {
  const WeekScreen({super.key, required this.weekStart});

  final String weekStart;

  @override
  Widget build(BuildContext context) {
    final CalendarDate? week;
    try {
      week = CalendarDate.parse(weekStart).weekStart;
    } on FormatException {
      return Scaffold(
        appBar: AppBar(title: const Text('Week')),
        body: const EmptyState(
          icon: Icons.search_off,
          message: 'Week not found',
        ),
      );
    }
    return Scaffold(
      appBar: AppBar(title: Text('Week ${formatWeek(week)}')),
      body: MaxWidthBody(
        child: ListView(
          padding: const EdgeInsets.only(bottom: 24),
          children: [WeekSummaryView(weekStart: week)],
        ),
      ),
    );
  }
}
