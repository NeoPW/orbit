import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'calendar_date.dart';
import 'clock.dart';

part 'today.g.dart';

/// Today's local calendar date. Moves to the next date at local midnight
/// and when the app returns to the foreground on a later date, and only
/// notifies when the date actually changed. Tests override it with a fixed
/// date.
@Riverpod(keepAlive: true)
class Today extends _$Today {
  Timer? _midnight;

  @override
  CalendarDate build() {
    final listener = AppLifecycleListener(onResume: refresh);
    ref.onDispose(() {
      _midnight?.cancel();
      listener.dispose();
    });
    _scheduleMidnight();
    return CalendarDate.today(ref.watch(clockProvider));
  }

  /// Re-reads the date from the clock.
  void refresh() {
    final today = CalendarDate.today(ref.read(clockProvider));
    if (today != state) state = today;
    _scheduleMidnight();
  }

  void _scheduleMidnight() {
    _midnight?.cancel();
    final now = ref.read(clockProvider)().toLocal();
    final nextMidnight = DateTime(now.year, now.month, now.day + 1);
    // A second of slack so the clock reads the new date when it fires.
    final delay = nextMidnight.difference(now) + const Duration(seconds: 1);
    _midnight = Timer(delay, refresh);
  }
}
