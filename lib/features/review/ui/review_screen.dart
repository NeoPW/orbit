import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/routes.dart';
import '../../../core/widgets/max_width_body.dart';
import '../../../core/widgets/section_heading.dart';
import '../data/review_providers.dart';
import '../data/review_repository.dart';
import 'week_format.dart';
import 'week_summary_view.dart';

/// The Review tab (weekly-review spec): this week's plan, the review
/// button, the review week's summary and the history.
class ReviewScreen extends ConsumerWidget {
  const ReviewScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final week = ref.watch(reviewWeekProvider);
    final review = ref.watch(reviewForWeekProvider(week)).value;
    final label = review == null
        ? 'Start weekly review'
        : review.completedAt == null
        ? 'Continue weekly review'
        : 'Edit weekly review';
    return Scaffold(
      appBar: AppBar(title: const Text('Review')),
      body: MaxWidthBody(
        child: ListView(
          padding: const EdgeInsets.only(bottom: 24),
          children: [
            const _PlanCard(),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: FilledButton.icon(
                onPressed: () => context.push(Routes.weeklyReview),
                icon: const Icon(Icons.rate_review_outlined),
                label: Text(label),
              ),
            ),
            SectionHeading('Week ${formatWeek(week)}'),
            WeekSummaryView(weekStart: week),
            const SectionHeading('History'),
            ListTile(
              leading: const Icon(Icons.history),
              title: const Text('Past reviews'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push(Routes.reviewHistory),
            ),
          ],
        ),
      ),
    );
  }
}

/// The plan written in the most recently completed review.
class _PlanCard extends ConsumerWidget {
  const _PlanCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final latest = ref.watch(completedReviewsProvider).value?.firstOrNull;
    final plan = latest?.planNextWeek ?? '';
    return Card(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("This week's plan", style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            if (latest == null)
              Text(
                'No plan yet. Write one in your weekly review.',
                style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
              )
            else ...[
              Text(plan.isEmpty ? 'No plan written' : plan),
              const SizedBox(height: 8),
              Text(
                'From the review of ${formatWeek(latest.weekStart)}',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
