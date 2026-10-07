import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/router/routes.dart';
import 'package:orbit/features/habits/ui/habit_form.dart';

import '../../../helpers/pump_app.dart';
import '../../../helpers/seed.dart';
import '../../../helpers/test_db.dart';

Finder field(String label) => find.widgetWithText(TextFormField, label);

Future<void> save(WidgetTester tester) async {
  await tester.tap(find.text('Save'));
  await tester.pumpAndSettle();
}

void main() {
  late AppDatabase db;
  late Seed seed;

  setUp(() {
    db = newTestDatabase();
    seed = Seed(db);
  });

  Future<List<Habit>> habits() =>
      (db.select(db.habits)..where((h) => h.deletedAt.isNull())).get();

  group('Habits screen', () {
    testApp('tapping a habit opens its edit form in a sheet', (tester) async {
      await seed.habits.create(
        title: 'Stretch',
        scheduleType: ScheduleType.daily,
      );
      final app = await pumpApp(tester, db: db, location: Routes.habits);
      await tester.tap(find.text('Stretch'));
      await tester.pumpAndSettle();
      expect(find.text('Edit habit'), findsOneWidget);
      expect(find.byType(BottomSheet), findsOneWidget);
      expect(app.router.state.uri.path, Routes.habits);
    });

    testApp('marks inactive habits and unlinked habits', (tester) async {
      final p = await seed.projects.create(title: 'Thesis');
      await seed.habits.create(
        title: 'Write',
        projectId: p.id,
        scheduleType: ScheduleType.weekdays,
        weekdays: {1, 3, 5},
        reminderTime: '07:30',
      );
      await seed.habits.create(
        title: 'Meditate',
        scheduleType: ScheduleType.daily,
        active: false,
      );
      await pumpApp(tester, db: db, location: Routes.habits);

      expect(find.text('Thesis'), findsOneWidget);
      expect(
        find.textContaining('Mon, Wed, Fri · Reminder 07:30'),
        findsOneWidget,
      );
      expect(find.textContaining('No link'), findsNothing);
      expect(find.text('Inactive'), findsOneWidget);
      final inactiveTile = find.ancestor(
        of: find.text('Meditate'),
        matching: find.byType(ListTile),
      );
      expect(
        find.descendant(of: inactiveTile, matching: find.text('Inactive')),
        findsOneWidget,
      );
    });
  });

  group('Habit form', () {
    testApp('a habit without any link saves', (tester) async {
      await pumpSheet(tester, (c) => showHabitForm(c), db: db);
      await tester.enterText(field('Title'), 'Meditate');
      await save(tester);

      final habit = (await habits()).single;
      expect(habit.title, 'Meditate');
      expect(habit.projectId, isNull);
      expect(habit.keyResultId, isNull);
      expect(habit.scheduleType, ScheduleType.daily);
      expect(habit.active, isTrue);
    });

    testApp('weekdays without a day is rejected', (tester) async {
      await pumpSheet(tester, (c) => showHabitForm(c), db: db);
      await tester.enterText(field('Title'), 'Gym');
      await tester.tap(find.text('Weekdays'));
      await tester.pumpAndSettle();
      await save(tester);

      expect(find.text('Pick at least one day'), findsOneWidget);
      expect(await habits(), isEmpty);
    });

    testApp('weekdays are saved Monday-first', (tester) async {
      // From the Habits screen, so the saved habit shows in the list.
      await pumpApp(tester, db: db, location: Routes.habits, height: 1000);
      await tester.tap(find.byType(FloatingActionButton));
      await tester.pumpAndSettle();
      await tester.enterText(field('Title'), 'Gym');
      await tester.tap(find.text('Weekdays'));
      await tester.pumpAndSettle();
      for (final day in ['Fri', 'Mon', 'Wed']) {
        await tester.tap(find.text(day));
      }
      await tester.pump();
      await save(tester);

      expect((await habits()).single.weekdays, {1, 3, 5});
      expect(find.textContaining('Mon, Wed, Fri'), findsOneWidget);
    });

    testApp('8 times per week is rejected', (tester) async {
      await pumpSheet(tester, (c) => showHabitForm(c), db: db);
      await tester.enterText(field('Title'), 'Read');
      await tester.tap(find.text('Times per week'));
      await tester.pumpAndSettle();
      await tester.enterText(field('Times per week'), '8');
      await save(tester);

      expect(find.text('Enter a number from 1 to 7'), findsOneWidget);
      expect(await habits(), isEmpty);

      await tester.enterText(field('Times per week'), '3');
      await save(tester);
      expect((await habits()).single.timesPerWeek, 3);
    });

    testApp('the reminder field explains the default time', (tester) async {
      await pumpSheet(tester, (c) => showHabitForm(c), db: db);
      expect(
        find.text('Without a time, the default reminder time is used.'),
        findsOneWidget,
      );
    });

    testApp('links a project and sets a reminder time', (tester) async {
      await seed.projects.create(title: 'Thesis');
      await pumpSheet(tester, (c) => showHabitForm(c), db: db);
      await tester.enterText(field('Title'), 'Write');
      await tester.tap(find.text('No project'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Thesis').last);
      await tester.pumpAndSettle();

      await tester.tap(
        find.widgetWithText(InputDecorator, 'Reminder time (optional)'),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byIcon(Icons.keyboard_outlined));
      await tester.pumpAndSettle();
      final inputs = find.descendant(
        of: find.byType(Dialog),
        matching: find.byType(TextField),
      );
      await tester.enterText(inputs.at(0), '7');
      await tester.enterText(inputs.at(1), '30');
      await tester.tap(find.text('OK'));
      await tester.pumpAndSettle();
      expect(find.text('07:30'), findsOneWidget);
      await save(tester);

      final habit = (await habits()).single;
      expect(habit.reminderTime, '07:30');
      expect(habit.projectId, isNotNull);
    });

    testApp('deactivates a habit', (tester) async {
      final h = await seed.habits.create(
        title: 'Stretch',
        scheduleType: ScheduleType.daily,
      );
      await pumpSheet(tester, (c) => showHabitForm(c, habitId: h.id), db: db);
      await tester.tap(find.text('Active'));
      await save(tester);
      expect((await seed.habits.get(h.id))!.active, isFalse);
    });

    testApp('deletes a habit after confirmation', (tester) async {
      final h = await seed.habits.create(
        title: 'Stretch',
        scheduleType: ScheduleType.daily,
      );
      await pumpSheet(tester, (c) => showHabitForm(c, habitId: h.id), db: db);
      await tester.tap(find.byTooltip('Delete habit'));
      await tester.pumpAndSettle();
      expect(find.textContaining('without a linked habit'), findsOneWidget);
      await tester.tap(find.widgetWithText(FilledButton, 'Delete'));
      await tester.pumpAndSettle();
      expect(await habits(), isEmpty);
    });
  });
}
