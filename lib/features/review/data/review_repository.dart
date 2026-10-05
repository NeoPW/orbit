import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/db/app_database.dart';
import '../../../core/db/database_providers.dart';
import '../../../core/db/ids.dart' show idGeneratorProvider;
import '../../../core/db/repository_support.dart';
import '../../../core/time/clock.dart' show clockProvider;

part 'review_repository.g.dart';

/// Weekly reviews (one per week) and the KR progress snapshots stored when
/// a review is saved.
class ReviewRepository extends Repository {
  ReviewRepository(super.db, super.clock, super.newId);

  /// The review of the week starting [weekStart], draft or completed.
  Stream<WeeklyReview?> watchForWeek(CalendarDate weekStart) =>
      (db.select(db.weeklyReviews)
            ..where((r) => alive(r) & r.weekStart.equalsValue(weekStart)))
          .watchSingleOrNull();

  Future<WeeklyReview?> getForWeek(CalendarDate weekStart) =>
      (db.select(db.weeklyReviews)
            ..where((r) => alive(r) & r.weekStart.equalsValue(weekStart)))
          .getSingleOrNull();

  Stream<WeeklyReview?> watch(String id) => (db.select(
    db.weeklyReviews,
  )..where((r) => alive(r) & r.id.equals(id))).watchSingleOrNull();

  /// Completed reviews, newest week first.
  Stream<List<WeeklyReview>> watchCompleted() =>
      (db.select(db.weeklyReviews)
            ..where((r) => alive(r) & r.completedAt.isNotNull())
            ..orderBy([(r) => OrderingTerm.desc(r.weekStart)]))
          .watch();

  /// For each KR, its progress in the most recent completed review of a
  /// week before [weekStart].
  Stream<Map<String, double>> watchLatestSnapshotsBefore(
    CalendarDate weekStart,
  ) {
    final reviews = db.weeklyReviews;
    final snapshots = db.reviewKrSnapshots;
    final query =
        db.select(snapshots).join([
            innerJoin(reviews, reviews.id.equalsExp(snapshots.weeklyReviewId)),
          ])
          ..where(
            alive(snapshots) &
                alive(reviews) &
                reviews.completedAt.isNotNull() &
                reviews.weekStart.isSmallerThanValue(weekStart.toIso()),
          )
          ..orderBy([OrderingTerm.desc(reviews.weekStart)]);
    return query.watch().map((rows) {
      final latest = <String, double>{};
      for (final row in rows) {
        final snapshot = row.readTable(snapshots);
        latest.putIfAbsent(snapshot.keyResultId, () => snapshot.progress);
      }
      return latest;
    });
  }

  /// Stores score, reflection and plan of the week's review as a draft.
  /// A completed review stays completed.
  Future<WeeklyReview> saveDraft(
    CalendarDate weekStart, {
    int? score,
    String reflection = '',
    String plan = '',
  }) => db.transaction(
    () => _upsert(weekStart, score, reflection, plan, completedAt: null),
  );

  /// Saves the week's review as completed and replaces its KR snapshots
  /// with [snapshots] (progress by KR ID).
  Future<WeeklyReview> complete(
    CalendarDate weekStart, {
    required int score,
    String reflection = '',
    String plan = '',
    required Map<String, double> snapshots,
  }) => db.transaction(() async {
    final now = clock();
    final review = await _upsert(
      weekStart,
      score,
      reflection,
      plan,
      completedAt: now,
    );
    await softDeleteWhere(
      db.reviewKrSnapshots,
      (s) => s.weeklyReviewId.equals(review.id),
    );
    for (final MapEntry(key: krId, value: progress) in snapshots.entries) {
      await db
          .into(db.reviewKrSnapshots)
          .insert(
            ReviewKrSnapshotsCompanion.insert(
              id: newId(),
              createdAt: now,
              updatedAt: now,
              weeklyReviewId: review.id,
              keyResultId: krId,
              progress: progress,
            ),
          );
    }
    return review;
  });

  /// `week_start` is unique across soft-deleted rows, so an existing row
  /// is updated (and revived) instead of inserting a second one.
  /// [completedAt] null keeps the stored completion time.
  Future<WeeklyReview> _upsert(
    CalendarDate weekStart,
    int? score,
    String reflection,
    String plan, {
    required DateTime? completedAt,
  }) async {
    final now = clock();
    final existing = await (db.select(
      db.weeklyReviews,
    )..where((r) => r.weekStart.equalsValue(weekStart))).getSingleOrNull();
    if (existing == null) {
      return db
          .into(db.weeklyReviews)
          .insertReturning(
            WeeklyReviewsCompanion.insert(
              id: newId(),
              createdAt: now,
              updatedAt: now,
              weekStart: weekStart,
              score: Value(score),
              reflection: Value(reflection.trim()),
              planNextWeek: Value(plan.trim()),
              completedAt: Value(completedAt),
            ),
          );
    }
    final updated = existing.copyWith(
      deletedAt: const Value(null),
      updatedAt: now,
      score: Value(score),
      reflection: reflection.trim(),
      planNextWeek: plan.trim(),
      completedAt: Value(
        completedAt ??
            (existing.deletedAt == null ? existing.completedAt : null),
      ),
    );
    await db.update(db.weeklyReviews).replace(updated);
    return updated;
  }
}

@Riverpod(keepAlive: true)
ReviewRepository reviewRepository(Ref ref) => ReviewRepository(
  ref.watch(appDatabaseProvider),
  ref.watch(clockProvider),
  ref.watch(idGeneratorProvider),
);

/// The review of a week, draft or completed.
@riverpod
Stream<WeeklyReview?> reviewForWeek(Ref ref, CalendarDate weekStart) =>
    ref.watch(reviewRepositoryProvider).watchForWeek(weekStart);

@riverpod
Stream<WeeklyReview?> review(Ref ref, String id) =>
    ref.watch(reviewRepositoryProvider).watch(id);

/// Completed reviews, newest week first.
@riverpod
Stream<List<WeeklyReview>> completedReviews(Ref ref) =>
    ref.watch(reviewRepositoryProvider).watchCompleted();

/// Latest earlier snapshot per KR, for weeks before [weekStart].
@riverpod
Stream<Map<String, double>> latestSnapshotsBefore(
  Ref ref,
  CalendarDate weekStart,
) => ref.watch(reviewRepositoryProvider).watchLatestSnapshotsBefore(weekStart);
