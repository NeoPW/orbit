import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/time/calendar_date.dart';
import 'package:orbit/core/time/clock.dart';
import 'package:orbit/core/time/today.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late DateTime now;
  late ProviderContainer container;

  setUp(() {
    now = DateTime(2026, 10, 5, 23, 59);
    container = ProviderContainer(
      overrides: [clockProvider.overrideWithValue(() => now.toUtc())],
    );
  });

  tearDown(() => container.dispose());

  test('starts at the local date of the clock', () {
    expect(container.read(todayProvider), CalendarDate(2026, 10, 5));
  });

  test('a refresh after midnight emits the new date', () {
    final dates = <CalendarDate>[];
    container.listen(todayProvider, (_, next) => dates.add(next));

    now = DateTime(2026, 10, 6, 0, 1);
    container.read(todayProvider.notifier).refresh();

    expect(dates, [CalendarDate(2026, 10, 6)]);
    expect(container.read(todayProvider), CalendarDate(2026, 10, 6));
  });

  test('a refresh on the same date emits nothing', () {
    final dates = <CalendarDate>[];
    container.listen(todayProvider, (_, next) => dates.add(next));

    now = DateTime(2026, 10, 5, 23, 59, 30);
    container.read(todayProvider.notifier).refresh();

    expect(dates, isEmpty);
  });

  testWidgets('returning to the foreground refreshes the date', (tester) async {
    final dates = <CalendarDate>[];
    container.listen(todayProvider, (_, next) => dates.add(next));

    now = DateTime(2026, 10, 6, 8);
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.inactive);
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);

    expect(dates, [CalendarDate(2026, 10, 6)]);
    // Cancels the midnight timer before the fake-async test ends.
    container.dispose();
  });
}
