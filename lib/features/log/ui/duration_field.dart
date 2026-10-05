import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../domain/duration.dart';

/// The error text for an invalid duration input, or null when valid.
String? durationErrorText(String text) => switch (validateDuration(text)) {
  null => null,
  DurationError.notAWholeNumber => 'Enter whole minutes',
  DurationError.outOfRange => 'Enter 1 to $maxDurationMinutes minutes',
};

/// An optional duration in minutes.
class DurationField extends StatelessWidget {
  const DurationField({
    super.key,
    required this.controller,
    this.errorText,
    this.onChanged,
  });

  final TextEditingController controller;
  final String? errorText;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      decoration: InputDecoration(
        labelText: 'Minutes (optional)',
        errorText: errorText,
      ),
      keyboardType: TextInputType.number,
      inputFormatters: [FilteringTextInputFormatter.allow(RegExp('[0-9]'))],
      onChanged: onChanged,
    );
  }
}
