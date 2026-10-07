import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/routes.dart';
import '../../../core/widgets/async_body.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/max_width_body.dart';
import '../../../core/widgets/orbit_ring.dart';
import '../../../core/widgets/section_heading.dart';
import '../data/review_repository.dart';
import 'week_format.dart';

/// Completed reviews, newest week first.
class ReviewHistoryScreen extends ConsumerWidget {
  const ReviewHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Past reviews')),
      body: AsyncBody(
        value: ref.watch(completedReviewsProvider),
        data: (reviews) => reviews.isEmpty
            ? const EmptyState(
                icon: Icons.history,
                message: 'No completed reviews yet',
              )
            : MaxWidthBody(
                child: ListView(
                  children: [
                    for (final review in reviews)
                      ListTile(
                        leading: OrbitRing(
                          progress: (review.score ?? 0) / 10,
                          size: 44,
                          label: '${review.score}',
                        ),
                        title: Text(formatWeek(review.weekStart)),
                        subtitle: review.planNextWeek.isEmpty
                            ? null
                            : Text(
                                review.planNextWeek,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                        onTap: () => context.push(Routes.pastReview(review.id)),
                      ),
                  ],
                ),
              ),
      ),
    );
  }
}

/// One completed review in full.
class PastReviewScreen extends ConsumerWidget {
  const PastReviewScreen({super.key, required this.reviewId});

  final String reviewId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AsyncBody(
      value: ref.watch(reviewProvider(reviewId)),
      data: (review) => Scaffold(
        appBar: AppBar(
          title: Text(
            review == null ? 'Review' : 'Week ${formatWeek(review.weekStart)}',
          ),
        ),
        body: review == null
            ? const EmptyState(
                icon: Icons.search_off,
                message: 'Review not found',
              )
            : MaxWidthBody(
                child: ListView(
                  padding: const EdgeInsets.only(bottom: 24),
                  children: [
                    const SectionHeading('Score'),
                    ListTile(
                      leading: OrbitRing(
                        progress: (review.score ?? 0) / 10,
                        size: 44,
                        label: '${review.score}',
                      ),
                      title: Text('${review.score} / 10'),
                    ),
                    const SectionHeading('Reflection'),
                    _Text(review.reflection, empty: 'No reflection written'),
                    const SectionHeading('Plan for next week'),
                    _Text(review.planNextWeek, empty: 'No plan written'),
                  ],
                ),
              ),
      ),
    );
  }
}

class _Text extends StatelessWidget {
  const _Text(this.text, {required this.empty});

  final String text;
  final String empty;

  @override
  Widget build(BuildContext context) =>
      text.isEmpty ? SectionEmptyText(empty) : ListTile(title: Text(text));
}
