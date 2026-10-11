import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/db/app_database.dart';
import '../../../core/numbers.dart';
import '../data/measure_repository.dart';
import 'measure_form.dart';
import 'measure_tile.dart';

/// A measure on the goal page with its controls right in the row (measures
/// spec, "Record progress on the goal page"): − / + by the step and tapping
/// the value to enter it for a number, a done switch for yes/no, and the
/// check-ins (read-only) for a habit. Tapping the title edits the measure.
class MeasureRow extends ConsumerWidget {
  const MeasureRow({
    super.key,
    required this.measure,
    required this.progress,
    required this.color,
    this.habitCheckIns = 0,
  });

  final Measure measure;

  /// 0–1.
  final double progress;
  final Color color;
  final int habitCheckIns;

  Future<void> _enterValue(BuildContext context, WidgetRef ref) async {
    final repo = ref.read(measureRepositoryProvider);
    final value = await showDialog<double>(
      context: context,
      builder: (context) =>
          _ValueDialog(initial: measure.currentValue ?? 0, unit: measure.unit),
    );
    if (value != null) await repo.setProgressValue(measure.id, value);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final repo = ref.read(measureRepositoryProvider);
    final value = measureValueText(
      measure,
      progress: progress,
      habitCheckIns: habitCheckIns,
    );
    final muted = theme.textTheme.bodySmall?.copyWith(
      color: theme.colorScheme.onSurfaceVariant,
    );
    final step = formatNumber(measure.step);

    final Widget controls = switch (measure.measureType) {
      MeasureType.numeric => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            tooltip: 'Decrease ${measure.title} by $step',
            icon: const Icon(Icons.remove),
            onPressed: () => repo.nudge(measure.id, -measure.step),
          ),
          IconButton(
            tooltip: 'Increase ${measure.title} by $step',
            icon: const Icon(Icons.add),
            onPressed: () => repo.nudge(measure.id, measure.step),
          ),
        ],
      ),
      MeasureType.boolean => Switch(
        value: measure.currentValue == 1,
        onChanged: (done) => repo.setProgressValue(measure.id, done ? 1 : 0),
      ),
      MeasureType.habit => const SizedBox.shrink(),
    };

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 6, 8, 6),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                InkWell(
                  borderRadius: BorderRadius.circular(6),
                  onTap: () => showMeasureForm(
                    context,
                    goalId: measure.goalId,
                    measureId: measure.id,
                  ),
                  child: Text(measure.title, style: theme.textTheme.titleSmall),
                ),
                const SizedBox(height: 2),
                if (measure.measureType == MeasureType.numeric)
                  Semantics(
                    button: true,
                    label: 'Enter the current value of ${measure.title}',
                    child: InkWell(
                      borderRadius: BorderRadius.circular(6),
                      onTap: () => _enterValue(context, ref),
                      child: ExcludeSemantics(child: Text(value, style: muted)),
                    ),
                  )
                else
                  Text(value, style: muted),
                const SizedBox(height: 6),
                MeasureBar(progress: progress, color: color),
              ],
            ),
          ),
          controls,
        ],
      ),
    );
  }
}

class _ValueDialog extends StatefulWidget {
  const _ValueDialog({required this.initial, this.unit});

  final double initial;
  final String? unit;

  @override
  State<_ValueDialog> createState() => _ValueDialogState();
}

class _ValueDialogState extends State<_ValueDialog> {
  late final _value = TextEditingController(text: formatNumber(widget.initial));
  String? _error;

  @override
  void dispose() {
    _value.dispose();
    super.dispose();
  }

  void _save() {
    final value = parseNumber(_value.text);
    if (value == null) {
      setState(() => _error = 'Enter a number');
      return;
    }
    Navigator.of(context).pop(value);
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: const Text('Current value'),
    content: TextField(
      controller: _value,
      autofocus: true,
      decoration: InputDecoration(
        labelText: 'Current value',
        suffixText: widget.unit,
        errorText: _error,
      ),
      keyboardType: const TextInputType.numberWithOptions(
        decimal: true,
        signed: true,
      ),
      onSubmitted: (_) => _save(),
    ),
    actions: [
      TextButton(
        onPressed: () => Navigator.of(context).pop(),
        child: const Text('Cancel'),
      ),
      FilledButton(onPressed: _save, child: const Text('Save')),
    ],
  );
}
