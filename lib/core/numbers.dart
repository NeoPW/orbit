/// Parses a number typed by the user; accepts `.` or `,` as decimal
/// separator. Returns null for empty or invalid input.
double? parseNumber(String text) =>
    double.tryParse(text.trim().replaceAll(',', '.'));

/// Formats a number without a trailing `.0` for whole values.
String formatNumber(double value) => value == value.roundToDouble()
    ? value.toInt().toString()
    : value.toString();
