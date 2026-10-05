import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/db/ids.dart';
import 'package:orbit/core/router/routes.dart';
import 'package:orbit/core/time/today.dart';
import 'package:orbit/features/review/data/review_repository.dart';

import '../../../helpers/pump_app.dart';
import '../../../helpers/seed.dart';
import '../../../helpers/test_db.dart';

/// Sunday: the review week is 2026-10-05 – 2026-10-11.
final today = CalendarDate(2026, 10, 11);
final week = CalendarDate(2026, 10, 5);

const steps = ['Look back', 'Projects', 'Key results', 'Score', 'Plan', 'Save'];

/// Scrolls [finder] into view, then taps it.
Future<void> tapVisible(WidgetTester tester, Finder finder) async {
  await tester.ensureVisible(finder);
  await tester.pumpAndSettle();
  await tester.tap(finder);
  await tester.pumpAndSettle();
}

void main() {
  late AppDatabase db;
  late Seed seed;
  setUp(() {
    db = newTestDatabase();
    seed = Seed(db);
  });

  Future<WeeklyReview?> stored() => (db.select(
    db.weeklyReviews,
  )..where((r) => r.deletedAt.isNull())).getSingleOrNull();

  /// Opens the Review tab, then the weekly review.
  Future<GoRouter> openReview(WidgetTester tester) async {
    final app = await pumpApp(
      tester,
      db: db,
      location: Routes.review,
      height: 1600,
      overrides: [todayProvider.overrideWithValue(today)],
    );
    await tester.tap(find.byType(FilledButton));
    await tester.pumpAndSettle();
    return app.router;
  }

  /// Taps the step title. The vertical stepper builds every step's
  /// content (collapsed ones off-screen), so only tappable texts count; the
  /// last of those is the title ("Key results" is also a heading in the
  /// look-back summary).
  Future<void> goToStep(WidgetTester tester, String title) async {
    await tapVisible(tester, find.text(title).hitTestable().last);
  }

  Future<void> leave(WidgetTester tester, GoRouter router) async {
    router.pop();
    await tester.pumpAndSettle();
  }

  bool chipSelected(WidgetTester tester, String label) => tester
      .widget<ChoiceChip>(find.widgetWithText(ChoiceChip, label))
      .selected;

  group('steps', () {
    testApp('in order: look back, projects, KRs, score, plan, save', (
      tester,
    ) async {
      await openReview(tester);
      expect(find.text('Review 05-10-2026 – 11-10-2026'), findsOneWidget);
      final ys = [
        for (final title in steps)
          tester.getTopLeft(find.text(title).hitTestable().last).dy,
      ];
      expect(ys, [...ys]..sort());
    });

    testApp('an existing draft is prefilled', (tester) async {
      await ReviewRepository(
        db,
        () => DateTime.now().toUtc(),
        uuidV4,
      ).saveDraft(week, score: 7, reflection: 'Good week', plan: 'Ch. 3');
      await openReview(tester);
      await goToStep(tester, 'Score');
      expect(chipSelected(tester, '7'), isTrue);
      expect(find.text('Good week'), findsOneWidget);
      await goToStep(tester, 'Plan');
      expect(find.text('Ch. 3'), findsOneWidget);
    });
  });

  group('projects step', () {
    testApp('pausing a project takes effect immediately', (tester) async {
      final p = await seed.projects.create(title: 'Garden');
      await openReview(tester);
      await goToStep(tester, 'Projects');
      await tester.tap(find.byTooltip('Status of Garden'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Paused').last);
      await tester.pumpAndSettle();

      expect((await seed.projects.get(p.id))!.status, ProjectStatus.paused);
      expect(find.text('Garden'), findsNothing);
    });

    testApp('setting a next step', (tester) async {
      final p = await seed.projects.create(title: 'Garden');
      await openReview(tester);
      await goToStep(tester, 'Projects');
      await tester.tap(find.byTooltip('Set next step'));
      await tester.pumpAndSettle();
      await tester.enterText(
        find.widgetWithText(TextField, 'Title'),
        'Order seeds',
      );
      await tester.tap(find.text('Save').last);
      await tester.pumpAndSettle();

      expect(find.text('Next: Order seeds'), findsOneWidget);
      final next = await seed.projects.nextStep(
        (await seed.projects.get(p.id))!,
      );
      expect(next!.title, 'Order seeds');
    });
  });

  group('key results step', () {
    testApp('updating a numeric value from 40 to 55', (tester) async {
      final o = await seed.objective();
      final kr = await seed.kr(o.id, title: 'Run 100 km', current: 40);
      await openReview(tester);
      await goToStep(tester, 'Key results');
      await tester.enterText(find.widgetWithText(TextField, 'Current'), '55');
      await tester.pumpAndSettle();

      final stored = await (db.select(
        db.keyResults,
      )..where((k) => k.id.equals(kr.id))).getSingle();
      expect(stored.currentValue, 55);
      expect(find.text('55 %'), findsWidgets);
    });

    testApp('habit KRs are shown read-only', (tester) async {
      final o = await seed.objective();
      await seed.kr(
        o.id,
        title: 'Run 20 times',
        type: MeasureType.habit,
        target: 20,
        start: null,
        current: null,
        unit: null,
      );
      await openReview(tester);
      await goToStep(tester, 'Key results');
      // The last one is in the KR step; the first in the look-back summary.
      final tile = find.widgetWithText(ListTile, 'Run 20 times').last;
      expect(tile, findsOneWidget);
      expect(
        find.descendant(of: tile, matching: find.byType(TextField)),
        findsNothing,
      );
      expect(
        find.descendant(of: tile, matching: find.byType(Switch)),
        findsNothing,
      );
    });
  });

  group('score, plan and save', () {
    testApp('a draft survives leaving and reopening', (tester) async {
      final router = await openReview(tester);
      await goToStep(tester, 'Score');
      await tester.tap(find.widgetWithText(ChoiceChip, '7'));
      await tester.enterText(
        find.widgetWithText(TextField, 'Reflection'),
        'Busy week',
      );
      await tester.pumpAndSettle();
      await leave(tester, router);

      expect(find.text('Continue weekly review'), findsOneWidget);
      expect((await stored())!.score, 7);

      await tester.tap(find.text('Continue weekly review'));
      await tester.pumpAndSettle();
      await goToStep(tester, 'Score');
      expect(chipSelected(tester, '7'), isTrue);
      expect(find.text('Busy week'), findsOneWidget);
    });

    testApp('saving without a score is blocked', (tester) async {
      await openReview(tester);
      await goToStep(tester, 'Save');
      await tapVisible(
        tester,
        find.widgetWithText(FilledButton, 'Save').hitTestable(),
      );

      expect(find.text('Choose a score to save the review'), findsOneWidget);
      expect((await stored())?.completedAt, isNull);
    });

    testApp('saving completes the review with snapshots', (tester) async {
      final o = await seed.objective();
      await seed.kr(o.id, title: 'Run 100 km', current: 40);
      await openReview(tester);
      await goToStep(tester, 'Score');
      await tester.tap(find.widgetWithText(ChoiceChip, '8'));
      await tester.pumpAndSettle();
      await goToStep(tester, 'Plan');
      await tester.enterText(
        find.widgetWithText(TextField, 'Plan for next week'),
        'Chapter 3',
      );
      await goToStep(tester, 'Save');
      await tapVisible(
        tester,
        find.widgetWithText(FilledButton, 'Save').hitTestable(),
      );

      expect(find.text('Edit weekly review'), findsOneWidget);
      expect(find.text('Chapter 3'), findsOneWidget);
      final review = (await stored())!;
      expect(review.score, 8);
      expect(review.completedAt, isNotNull);
      final snapshots = await db.select(db.reviewKrSnapshots).get();
      expect(snapshots.single.progress, 0.4);
    });
  });
}
