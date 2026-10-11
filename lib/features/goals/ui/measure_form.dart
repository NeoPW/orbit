import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/db/app_database.dart';
import '../../../core/numbers.dart';
import '../../../core/widgets/confirm_delete.dart';
import '../../../core/widgets/form_sheet.dart';
import '../../habits/data/habit_repository.dart';
import '../data/goal_repository.dart';
import '../data/measure_repository.dart';

/// Opens the measure form in a sheet: a new measure for [goalId], or
/// [measureId] of that goal.
Future<FormResult?> showMeasureForm(
  BuildContext context, {
  required String goalId,
  String? measureId,
}) => showFormSheet(
  context,
  builder: (_) => MeasureFormSheet(goalId: goalId, measureId: measureId),
);

/// Creates a measure for [goalId], or edits [measureId].
class MeasureFormSheet extends ConsumerWidget {
  const MeasureFormSheet({super.key, required this.goalId, this.measureId});

  final String goalId;

  /// Null to create a new measure.
  final String? measureId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final id = measureId;
    return FormSheetLoader<(Measure?, Goal)>(
      load: () async {
        final measure = id == null
            ? null
            : await ref.read(measureRepositoryProvider).get(id);
        final goal = await ref.read(goalRepositoryProvider).get(goalId);
        return (id != null && measure == null) || goal == null
            ? null
            : (measure, goal);
      },
      builder: (loaded) => _MeasureForm(measure: loaded!.$1, goal: loaded.$2),
    );
  }
}

class _MeasureForm extends ConsumerStatefulWidget {
  const _MeasureForm({required this.measure, required this.goal});

  final Measure? measure;
  final Goal goal;

  @override
  ConsumerState<_MeasureForm> createState() => _MeasureFormState();
}

class _MeasureFormState extends ConsumerState<_MeasureForm> {
  final _formKey = GlobalKey<FormState>();
  late final Measure? _measure = widget.measure;
  late final _title = TextEditingController(text: _measure?.title);
  late final _description = TextEditingController(text: _measure?.description);
  late MeasureType _type = _measure?.measureType ?? MeasureType.numeric;
  late final _start = _numberController(
    _measure?.measureType == MeasureType.numeric ? _measure?.startValue : 0,
  );
  late final _target = _numberController(_measure?.targetValue);
  late final _current = _numberController(
    _measure?.measureType == MeasureType.numeric ? _measure?.currentValue : 0,
  );
  late final _unit = TextEditingController(text: _measure?.unit);
  late final _step = _numberController(_measure?.step ?? 1);
  late bool _achieved = _measure?.currentValue == 1;
  late String? _habitId = _measure?.habitId;

  static TextEditingController _numberController(double? value) =>
      TextEditingController(text: value == null ? '' : formatNumber(value));

  @override
  void dispose() {
    for (final controller in [
      _title,
      _description,
      _start,
      _target,
      _current,
      _unit,
      _step,
    ]) {
      controller.dispose();
    }
    super.dispose();
  }

  String? _requiredNumber(String? text) =>
      parseNumber(text ?? '') == null ? 'Enter a number' : null;

  String? _positiveNumber(String? text) {
    final value = parseNumber(text ?? '');
    return value == null || value <= 0 ? 'Enter a number above 0' : null;
  }

  String? _positiveWholeNumber(String? text) {
    final value = parseNumber(text ?? '');
    return value == null || value < 1 || value != value.roundToDouble()
        ? 'Enter a whole number of at least 1'
        : null;
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final repo = ref.read(measureRepositoryProvider);

    final (double? start, double? target, double? current) = switch (_type) {
      MeasureType.numeric => (
        parseNumber(_start.text),
        parseNumber(_target.text),
        parseNumber(_current.text),
      ),
      MeasureType.boolean => (0, 1, _achieved ? 1 : 0),
      MeasureType.habit => (null, parseNumber(_target.text), null),
    };

    final step = _type == MeasureType.numeric ? parseNumber(_step.text)! : 1.0;
    final measure = _measure;
    if (measure == null) {
      await repo.create(
        goalId: widget.goal.id,
        title: _title.text,
        description: _description.text,
        measureType: _type,
        startValue: start,
        targetValue: target,
        currentValue: current,
        unit: _unit.text,
        step: step,
        habitId: _habitId,
      );
    } else {
      await repo.update(
        measure.copyWith(
          title: _title.text,
          description: _description.text,
          measureType: _type,
          startValue: Value(start),
          targetValue: Value(target),
          currentValue: Value(current),
          unit: Value(_unit.text),
          step: step,
          habitId: Value(_habitId),
        ),
      );
    }
    if (mounted) closeFormSheet(context);
  }

  Future<void> _delete() async {
    final measure = _measure!;
    final confirmed = await confirmDelete(
      context,
      title: 'Delete measure?',
      message: 'This deletes "${measure.title}" from "${widget.goal.title}".',
    );
    if (!confirmed) return;
    await ref.read(measureRepositoryProvider).delete(measure.id);
    if (mounted) closeFormSheet(context, FormResult.deleted);
  }

  Widget _numberField(
    TextEditingController controller,
    String label,
    String? Function(String?) validator,
  ) => TextFormField(
    controller: controller,
    decoration: InputDecoration(
      labelText: label,
      border: const OutlineInputBorder(),
    ),
    keyboardType: const TextInputType.numberWithOptions(
      decimal: true,
      signed: true,
    ),
    validator: validator,
  );

  List<Widget> _measureFields() => switch (_type) {
    MeasureType.numeric => [
      _numberField(_start, 'Start value', _requiredNumber),
      _numberField(_target, 'Target value', _requiredNumber),
      _numberField(_current, 'Current value', _requiredNumber),
      TextFormField(
        controller: _unit,
        decoration: const InputDecoration(
          labelText: 'Unit (optional)',
          hintText: 'e.g. km, pages',
          border: OutlineInputBorder(),
        ),
      ),
      _numberField(_step, 'Step', _positiveNumber),
    ],
    MeasureType.boolean => [
      SwitchListTile(
        title: const Text('Achieved'),
        value: _achieved,
        onChanged: (value) => setState(() => _achieved = value),
      ),
    ],
    MeasureType.habit => [
      _HabitPicker(
        value: _habitId,
        onChanged: (id) => setState(() => _habitId = id),
      ),
      _numberField(_target, 'Target check-ins', _positiveWholeNumber),
    ],
  };

  @override
  Widget build(BuildContext context) {
    final editing = _measure != null;
    return FormSheetFrame(
      formKey: _formKey,
      title: editing ? 'Edit measure' : 'New measure',
      onSave: _save,
      onDelete: editing ? _delete : null,
      deleteTooltip: 'Delete measure',
      children: [
        Text(widget.goal.title, style: Theme.of(context).textTheme.titleSmall),
        TextFormField(
          controller: _title,
          autofocus: !editing,
          decoration: const InputDecoration(
            labelText: 'Title',
            border: OutlineInputBorder(),
          ),
          textCapitalization: TextCapitalization.sentences,
          validator: (value) =>
              (value ?? '').trim().isEmpty ? 'Enter a title' : null,
        ),
        TextFormField(
          controller: _description,
          decoration: const InputDecoration(
            labelText: 'Description (optional)',
            border: OutlineInputBorder(),
          ),
          minLines: 1,
          maxLines: 4,
        ),
        SegmentedButton<MeasureType>(
          segments: const [
            ButtonSegment(value: MeasureType.numeric, label: Text('Number')),
            ButtonSegment(value: MeasureType.boolean, label: Text('Yes/no')),
            ButtonSegment(value: MeasureType.habit, label: Text('Habit')),
          ],
          selected: {_type},
          onSelectionChanged: (selection) =>
              setState(() => _type = selection.single),
        ),
        ..._measureFields(),
      ],
    );
  }
}

class _HabitPicker extends ConsumerWidget {
  const _HabitPicker({required this.value, required this.onChanged});

  final String? value;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final habits = ref.watch(habitsProvider).value ?? const <Habit>[];
    final known = habits.any((h) => h.id == value);
    return DropdownButtonFormField<String?>(
      initialValue: known ? value : null,
      decoration: const InputDecoration(
        labelText: 'Habit (optional)',
        border: OutlineInputBorder(),
      ),
      items: [
        const DropdownMenuItem(value: null, child: Text('No habit')),
        for (final habit in habits)
          DropdownMenuItem(value: habit.id, child: Text(habit.title)),
      ],
      onChanged: onChanged,
    );
  }
}
