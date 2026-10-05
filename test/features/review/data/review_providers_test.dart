import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/time/clock.dart';
import 'package:orbit/core/time/today.dart';
import 'package:orbit/features/log/data/log_repository.dart';
import 'package:orbit/features/review/data/review_providers.dart';

import '../../../helpers/provider_container.dart';
import '../../../helpers/repos.dart';
import '../../../helpers/test_db.dart';

void main() {
  // todayProvider listens to the app lifecycle.
  TestWidgetsFlutterBinding.ensureInitialized();

  late Repos r;
  late ProviderContainer container;
  // Sunday 2026-10-11, 18:00 local.
  var now = DateTime(2026, 10, 11, 18);
  final week = CalendarDate(2026, 10, 5);

  setUp(() {
    r = Repos();
    now = DateTime(2026, 10, 11, 18);
    container = containerWith(
      r.db,
      overrides: [clockProvider.overrideWithValue(() => now.toUtc())],
    );
  });
  tearDown(() async {
    container.dispose();
    await r.close();
  });

  test('the review week follows today', () {
    expect(container.read(reviewWeekProvider), week);

    now = DateTime(2026, 10, 13, 8);
    container.read(todayProvider.notifier).refresh();
    expect(container.read(reviewWeekProvider), week);

    now = DateTime(2026, 10, 18, 8);
    container.read(todayProvider.notifier).refresh();
    expect(container.read(reviewWeekProvider), CalendarDate(2026, 10, 12));
  });

  test('a new log entry in the week updates the summary', () async {
    final p = await r.projects.create(title: 'Thesis');
    await valueWhere(
      container,
      weekSummaryProvider(week),
      (s) => s.work.isEmpty,
    );

    await LogRepository(
      r.db,
      TestClock(DateTime(2026, 10, 7, 10).toUtc()).call,
      () => 'entry-1',
    ).createManual(projectId: p.id, durationMinutes: 30);

    final summary = await valueWhere(
      container,
      weekSummaryProvider(week),
      (s) => s.work.isNotEmpty,
    );
    expect(summary.work.single.title, 'Thesis');
    expect(summary.work.single.minutes, 30);
  });
}
