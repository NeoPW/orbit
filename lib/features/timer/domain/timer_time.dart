/// Time since [startedAt], never negative (device clocks may differ).
Duration timerElapsed(DateTime startedAt, DateTime now) {
  final elapsed = now.difference(startedAt);
  return elapsed.isNegative ? Duration.zero : elapsed;
}

/// The duration a stopped timer logs: the elapsed whole minutes, at least 1
/// (work-timer spec, "Stop a timer").
int loggedMinutes(Duration elapsed) =>
    elapsed.inMinutes < 1 ? 1 : elapsed.inMinutes;

/// The running time as `m:ss`, from one hour on as `h:mm:ss`.
String formatElapsed(Duration elapsed) {
  String two(int n) => n.toString().padLeft(2, '0');
  final hours = elapsed.inHours;
  final minutes = elapsed.inMinutes % 60;
  final seconds = elapsed.inSeconds % 60;
  return hours > 0
      ? '$hours:${two(minutes)}:${two(seconds)}'
      : '$minutes:${two(seconds)}';
}
