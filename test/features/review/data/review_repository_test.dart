import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';

import '../../../helpers/repos.dart';

void main() {
  late Repos r;
  setUp(() => r = Repos());
  tearDown(() => r.close());

  final week = CalendarDate(2026, 10, 5);

  Future<List<ReviewKrSnapshot>> liveSnapshots() => (r.db.select(
    r.db.reviewKrSnapshots,
  )..where((s) => s.deletedAt.isNull())).get();

  group('drafts', () {
    test(
      'saveDraft creates the week\'s review without completing it',
      () async {
        final draft = await r.reviews.saveDraft(
          week,
          score: 7,
          reflection: ' Good ',
          plan: 'Chapter 3',
        );
        expect(draft.weekStart, week);
        expect(draft.score, 7);
        expect(draft.reflection, 'Good');
        expect(draft.completedAt, isNull);
        expect(await r.reviews.watchCompleted().first, isEmpty);
      },
    );

    test('saving again updates the same row', () async {
      final first = await r.reviews.saveDraft(week, score: 5);
      final second = await r.reviews.saveDraft(week, score: 8);
      expect(second.id, first.id);
      expect((await r.reviews.getForWeek(week))!.score, 8);
    });

    test('a soft-deleted review of the week is revived', () async {
      final first = await r.reviews.saveDraft(week, score: 5);
      await r.db.customStatement(
        "UPDATE weekly_reviews SET deleted_at = '2026-10-05T12:00:00.000Z'",
      );
      final revived = await r.reviews.saveDraft(week, score: 6);
      expect(revived.id, first.id);
      expect(revived.deletedAt, isNull);
      expect(revived.completedAt, isNull);
    });

    test('a draft of a completed review keeps it completed', () async {
      await r.reviews.complete(week, score: 7, snapshots: const {});
      final draft = await r.reviews.saveDraft(week, score: 6);
      expect(draft.completedAt, isNotNull);
    });
  });

  group('complete', () {
    test('completes the review and stores snapshots', () async {
      final review = await r.reviews.complete(
        week,
        score: 8,
        plan: 'Chapter 3',
        snapshots: {'kr1': 0.4, 'kr2': 1},
      );
      expect(review.completedAt, isNotNull);
      final snapshots = await liveSnapshots();
      expect(
        {for (final s in snapshots) s.keyResultId: s.progress},
        {'kr1': 0.4, 'kr2': 1.0},
      );
      expect(snapshots.every((s) => s.weeklyReviewId == review.id), isTrue);
    });

    test('saving again replaces the snapshots', () async {
      await r.reviews.complete(week, score: 8, snapshots: {'kr1': 0.4});
      await r.reviews.complete(week, score: 6, snapshots: {'kr1': 0.5});

      final snapshots = await liveSnapshots();
      expect(snapshots.single.progress, 0.5);
      expect((await r.reviews.getForWeek(week))!.score, 6);
    });
  });

  test('history: completed reviews, newest week first', () async {
    await r.reviews.complete(
      CalendarDate(2026, 9, 28),
      score: 6,
      snapshots: const {},
    );
    await r.reviews.complete(week, score: 8, snapshots: const {});
    await r.reviews.saveDraft(CalendarDate(2026, 10, 12), score: 5);

    final history = await r.reviews.watchCompleted().first;
    expect(history.map((h) => h.weekStart), [week, CalendarDate(2026, 9, 28)]);
  });

  test('latest snapshot per KR from earlier completed reviews', () async {
    await r.reviews.complete(
      CalendarDate(2026, 9, 21),
      score: 5,
      snapshots: {'kr1': 0.1, 'kr2': 0.2},
    );
    await r.reviews.complete(
      CalendarDate(2026, 9, 28),
      score: 6,
      snapshots: {'kr1': 0.3},
    );
    // The review week itself and drafts do not count.
    await r.reviews.complete(week, score: 7, snapshots: {'kr1': 0.9});

    final latest = await r.reviews.watchLatestSnapshotsBefore(week).first;
    expect(latest, {'kr1': 0.3, 'kr2': 0.2});
  });
}
