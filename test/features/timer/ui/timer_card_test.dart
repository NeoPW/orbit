import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/router/routes.dart';
import 'package:orbit/core/time/clock.dart';
import 'package:orbit/features/timer/data/timer_repository.dart';
import 'package:orbit/features/timer/ui/timer_card.dart';

import '../../../helpers/pump_app.dart';
import '../../../helpers/seed.dart';
import '../../../helpers/test_db.dart';

void main() {
  late AppDatabase db;
  late Seed seed;
  late DateTime now;

  setUp(() {
    db = newTestDatabase();
    seed = Seed(db);
    now = DateTime.utc(2026, 10, 7, 9);
  });

  Future<void> startTimer(TimerTarget target) =>
      TimerRepository(db, () => now, TestIds().call).start(target);

  Future<void> pumpHome(WidgetTester tester) => pumpApp(
    tester,
    db: db,
    location: Routes.home,
    height: 1400,
    overrides: [clockProvider.overrideWithValue(() => now)],
  );

  Future<List<LogEntry>> entries() =>
      (db.select(db.logEntries)..where((e) => e.deletedAt.isNull())).get();

  testApp('a running timer shows its target and live time', (tester) async {
    final p = await seed.projects.create(title: 'Thesis');
    await startTimer(TimerForProject(p.id));
    now = now.add(const Duration(hours: 1, minutes: 5, seconds: 3));
    await pumpHome(tester);

    final card = find.byType(TimerCard);
    expect(
      find.descendant(of: card, matching: find.text('Thesis')),
      findsOneWidget,
    );
    expect(find.text('1:05:03'), findsOneWidget);
    expect(find.text('Stop'), findsOneWidget);
    expect(find.text('Discard'), findsOneWidget);

    now = now.add(const Duration(seconds: 1));
    await tester.pump(const Duration(seconds: 1));
    expect(find.text('1:05:04'), findsOneWidget);
  });

  testApp('the card sits between the header and the habits', (tester) async {
    final p = await seed.projects.create(title: 'Thesis');
    await startTimer(TimerForProject(p.id));
    await pumpHome(tester);
    final card = tester.getTopLeft(find.text('Stop')).dy;
    expect(card, greaterThan(tester.getTopLeft(find.text('Wednesday')).dy));
    expect(card, lessThan(tester.getTopLeft(find.text('Habits due today')).dy));
  });

  testApp('Stop logs the time and removes the card', (tester) async {
    final p = await seed.projects.create(title: 'Thesis');
    await startTimer(TimerForProject(p.id));
    now = now.add(const Duration(minutes: 45));
    await pumpHome(tester);

    await tester.tap(find.text('Stop'));
    await tester.pumpAndSettle();
    final entry = (await entries()).single;
    expect(entry.projectId, p.id);
    expect(entry.durationMinutes, 45);
    expect(entry.source, LogSource.timer);
    expect(find.text('Stop'), findsNothing);
    expect(find.text('Logged 45 min on Thesis'), findsOneWidget);
  });

  testApp('Discard removes the card without logging', (tester) async {
    final p = await seed.projects.create(title: 'Thesis');
    await startTimer(TimerForProject(p.id));
    await pumpHome(tester);

    await tester.tap(find.text('Discard'));
    await tester.pumpAndSettle();
    expect(await entries(), isEmpty);
    expect(find.text('Stop'), findsNothing);
    expect(find.text('Timer discarded'), findsOneWidget);
  });

  testApp('without a timer there is no card', (tester) async {
    await pumpHome(tester);
    expect(find.text('Stop'), findsNothing);
    expect(find.text('Discard'), findsNothing);
  });

  testApp('a timer for a completed task keeps its title', (tester) async {
    final task = await seed.tasks.create(title: 'Tax return');
    await startTimer(TimerForTask(task.id));
    await seed.tasks.complete(task.id);
    await pumpHome(tester);
    expect(
      find.descendant(
        of: find.byType(TimerCard),
        matching: find.text('Tax return'),
      ),
      findsOneWidget,
    );
    await tester.tap(find.text('Stop'));
    await tester.pumpAndSettle();
    final timerEntry = (await entries()).singleWhere(
      (e) => e.source == LogSource.timer,
    );
    expect(timerEntry.taskId, task.id);
  });
}
