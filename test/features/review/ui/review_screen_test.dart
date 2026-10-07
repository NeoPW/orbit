import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/router/routes.dart';
import 'package:orbit/core/time/today.dart';
import 'package:orbit/core/db/ids.dart';
import 'package:orbit/features/habits/data/habit_repository.dart';
import 'package:orbit/features/log/data/log_repository.dart';
import 'package:orbit/features/review/data/review_repository.dart';
import 'package:orbit/features/tasks/data/task_repository.dart';
import 'package:orbit/features/tasks/domain/task_assignment.dart';

import '../../../helpers/pump_app.dart';
import '../../../helpers/seed.dart';
import '../../../helpers/test_db.dart';

/// Sunday: the review week is 2026-10-05 – 2026-10-11.
final today = CalendarDate(2026, 10, 11);
final week = CalendarDate(2026, 10, 5);

void main() {
  late AppDatabase db;
  late Seed seed;
  late ReviewRepository reviews;
  setUp(() {
    db = newTestDatabase();
    seed = Seed(db);
    reviews = ReviewRepository(db, () => DateTime.now().toUtc(), uuidV4);
  });

  Future<({AppDatabase db, GoRouter router})> pumpReview(
    WidgetTester tester, {
    String location = Routes.review,
  }) => pumpApp(
    tester,
    db: db,
    location: location,
    height: 1600,
    overrides: [todayProvider.overrideWithValue(today)],
  );

  group('Review tab', () {
    testApp('without reviews: no plan yet, start the review', (tester) async {
      await pumpReview(tester);
      expect(
        find.text('No plan yet. Write one in your weekly review.'),
        findsOneWidget,
      );
      expect(find.text('Start weekly review'), findsOneWidget);
      expect(find.text('Week 05-10-2026 – 11-10-2026'), findsOneWidget);
    });

    testApp('shows the plan of the latest completed review', (tester) async {
      await reviews.complete(
        CalendarDate(2026, 9, 28),
        score: 7,
        plan: 'Finish chapter 3',
        snapshots: const {},
      );
      await pumpReview(tester);
      expect(find.text('Finish chapter 3'), findsOneWidget);
      expect(
        find.text('From the review of 28-09-2026 – 04-10-2026'),
        findsOneWidget,
      );
      expect(find.text('Start weekly review'), findsOneWidget);
    });

    testApp('a draft of the week: continue', (tester) async {
      await reviews.saveDraft(week, score: 5);
      await pumpReview(tester);
      expect(find.text('Continue weekly review'), findsOneWidget);
    });

    testApp('a completed week: edit', (tester) async {
      await reviews.complete(week, score: 8, snapshots: const {});
      await pumpReview(tester);
      expect(find.text('Edit weekly review'), findsOneWidget);
    });
  });

  group('week summary', () {
    testApp('shows each section with seeded data', (tester) async {
      final p = await seed.projects.create(title: 'Thesis');
      await HabitRepository(db, () => DateTime.utc(2026, 9, 1), uuidV4).create(
        title: 'Run',
        scheduleType: ScheduleType.timesPerWeek,
        timesPerWeek: 3,
      );
      final o = await seed.objective();
      await seed.kr(o.id, title: 'Run 100 km', current: 55);
      await reviewWithSnapshot(reviews, db, o.id);
      // Wednesday of the review week.
      final wednesday = DateTime(2026, 10, 7, 10).toUtc();
      await LogRepository(
        db,
        () => wednesday,
        uuidV4,
      ).createManual(projectId: p.id, durationMinutes: 75);
      final tasks = TaskRepository(db, () => wednesday, uuidV4);
      final t = await tasks.create(projectId: p.id, title: 'Book venue');
      await tasks.complete(t.id);
      await pumpReview(tester);

      expect(find.textContaining('1 h 15 min'), findsWidgets);
      expect(find.text('0 of 3'), findsOneWidget);
      expect(find.text('Book venue'), findsOneWidget);
      expect(find.text('55%'), findsOneWidget);
      expect(find.text('+15 since last review'), findsOneWidget);
    });

    testApp('a completed task shows its assignment and opens its page', (
      tester,
    ) async {
      final o = await seed.objective();
      final kr = await seed.kr(o.id, title: 'Run 100 km');
      final wednesday = DateTime(2026, 10, 7, 10).toUtc();
      final tasks = TaskRepository(db, () => wednesday, uuidV4);
      final t = await tasks.create(
        title: 'Book physio',
        assignment: ForKeyResult(kr.id),
      );
      await tasks.complete(t.id);
      final app = await pumpReview(tester);

      final tile = find.widgetWithText(ListTile, 'Book physio');
      expect(
        find.descendant(of: tile, matching: find.text('Run 100 km')),
        findsOneWidget,
      );
      await tester.ensureVisible(tile);
      await tester.tap(tile);
      await tester.pumpAndSettle();
      expect(
        app.router.routeInformationProvider.value.uri.path,
        Routes.task(t.id),
      );
    });

    testApp('empty sections say so', (tester) async {
      await pumpReview(tester);
      expect(find.text('Nothing logged'), findsOneWidget);
      expect(find.text('No active habits'), findsOneWidget);
      expect(find.text('No tasks completed'), findsOneWidget);
      expect(find.text('No key results'), findsOneWidget);
    });
  });

  group('history', () {
    testApp('newest week first; tapping shows the review in full', (
      tester,
    ) async {
      await reviews.complete(
        CalendarDate(2026, 9, 28),
        score: 6,
        plan: 'Older plan',
        snapshots: const {},
      );
      await reviews.complete(
        week,
        score: 8,
        reflection: 'Good week',
        plan: 'Newer plan',
        snapshots: const {},
      );
      await reviews.saveDraft(CalendarDate(2026, 10, 12), score: 3);
      await pumpReview(tester, location: Routes.reviewHistory);

      final titles = tester
          .widgetList<ListTile>(find.byType(ListTile))
          .map((t) => (t.title as Text).data)
          .toList();
      expect(titles, ['05-10-2026 – 11-10-2026', '28-09-2026 – 04-10-2026']);

      await tester.tap(find.text('05-10-2026 – 11-10-2026'));
      await tester.pumpAndSettle();
      expect(find.text('8 / 10'), findsOneWidget);
      expect(find.text('Good week'), findsOneWidget);
      expect(find.text('Newer plan'), findsOneWidget);
    });
  });
}

/// A completed review of the week before with the KR at 40 %.
Future<void> reviewWithSnapshot(
  ReviewRepository reviews,
  AppDatabase db,
  String objectiveId,
) async {
  final kr = await (db.select(
    db.keyResults,
  )..where((k) => k.objectiveId.equals(objectiveId))).getSingle();
  await reviews.complete(
    CalendarDate(2026, 9, 28),
    score: 6,
    snapshots: {kr.id: 0.4},
  );
}
