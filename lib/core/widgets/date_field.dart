import 'package:flutter/material.dart';

import '../time/calendar_date.dart';
import '../time/date_format.dart';

/// A read-only field showing a date as `dd-mm-yyyy`. Tapping opens a
/// calendar-only date picker (no locale-dependent text input).
class DateField extends StatelessWidget {
  const DateField({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.clearable = false,
    this.errorText,
    this.helperText,
  });

  final String label;
  final CalendarDate? value;
  final ValueChanged<CalendarDate?> onChanged;

  /// Shows a clear button for optional dates.
  final bool clearable;
  final String? errorText;
  final String? helperText;

  Future<void> _pick(BuildContext context) async {
    final initial = value?.toLocalDateTime() ?? DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
      initialEntryMode: DatePickerEntryMode.calendarOnly,
    );
    if (picked != null) onChanged(CalendarDate.fromDateTime(picked));
  }

  @override
  Widget build(BuildContext context) {
    final value = this.value;
    return InkWell(
      onTap: () => _pick(context),
      borderRadius: BorderRadius.circular(4),
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          errorText: errorText,
          helperText: helperText,
          border: const OutlineInputBorder(),
          suffixIcon: clearable && value != null
              ? IconButton(
                  tooltip: 'Clear $label',
                  icon: const Icon(Icons.clear),
                  onPressed: () => onChanged(null),
                )
              : const Icon(Icons.calendar_today_outlined),
        ),
        isEmpty: value == null,
        child: Text(value == null ? '' : formatDate(value)),
      ),
    );
  }
}
