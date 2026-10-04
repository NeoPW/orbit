import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/db/app_database.dart';
import '../../../core/numbers.dart';
import '../../../core/time/date_format.dart';
import '../../../core/widgets/confirm_delete.dart';
import '../../../core/widgets/date_field.dart';
import '../../../core/widgets/form_scaffold.dart';
import '../../habits/data/habit_repository.dart';
import '../../objectives/data/objective_repository.dart';
import '../data/key_result_repository.dart';

/// Creates a KR for [objectiveId], or edits [keyResultId].
class KeyResultFormScreen extends ConsumerWidget {
  const KeyResultFormScreen({super.key, this.keyResultId, this.objectiveId})
    : assert((keyResultId == null) != (objectiveId == null));

  final String? keyResultId;
  final String? objectiveId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final id = keyResultId;
    final newFor = objectiveId;
    return FormLoader<(KeyResult?, Objective)>(
      load: () async {
        final kr = id == null
            ? null
            : await ref.read(keyResultRepositoryProvider).get(id);
        final objective = await ref
            .read(objectiveRepositoryProvider)
            .get(kr?.objectiveId ?? newFor!);
        return (id != null && kr == null) || objective == null
            ? null
            : (kr, objective);
      },
      builder: (loaded) =>
          _KeyResultForm(keyResult: loaded!.$1, objective: loaded.$2),
    );
  }
}

class _KeyResultForm extends ConsumerStatefulWidget {
  const _KeyResultForm({required this.keyResult, required this.objective});

  final KeyResult? keyResult;
  final Objective objective;

  @override
  ConsumerState<_KeyResultForm> createState() => _KeyResultFormState();
}

class _KeyResultFormState extends ConsumerState<_KeyResultForm> {
  final _formKey = GlobalKey<FormState>();
  late final KeyResult? _kr = widget.keyResult;
  late final _title = TextEditingController(text: _kr?.title);
  late final _description = TextEditingController(text: _kr?.description);
  late MeasureType _type = _kr?.measureType ?? MeasureType.numeric;
  late final _start = _numberController(
    _kr?.measureType == MeasureType.numeric ? _kr?.startValue : 0,
  );
  late final _target = _numberController(_kr?.targetValue);
  late final _current = _numberController(
    _kr?.measureType == MeasureType.numeric ? _kr?.currentValue : 0,
  );
  late final _unit = TextEditingController(text: _kr?.unit);
  late bool _achieved = _kr?.currentValue == 1;
  late String? _habitId = _kr?.habitId;
  late CalendarDate? _deadline = _kr?.deadline;

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
    ]) {
      controller.dispose();
    }
    super.dispose();
  }

  String? _requiredNumber(String? text) =>
      parseNumber(text ?? '') == null ? 'Enter a number' : null;

  String? _positiveWholeNumber(String? text) {
    final value = parseNumber(text ?? '');
    return value == null || value < 1 || value != value.roundToDouble()
        ? 'Enter a whole number of at least 1'
        : null;
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final repo = ref.read(keyResultRepositoryProvider);

    final (double? start, double? target, double? current) = switch (_type) {
      MeasureType.numeric => (
        parseNumber(_start.text),
        parseNumber(_target.text),
        parseNumber(_current.text),
      ),
      MeasureType.boolean => (0, 1, _achieved ? 1 : 0),
      MeasureType.habit => (null, parseNumber(_target.text), null),
    };

    final kr = _kr;
    if (kr == null) {
      await repo.create(
        objectiveId: widget.objective.id,
        title: _title.text,
        description: _description.text,
        measureType: _type,
        startValue: start,
        targetValue: target,
        currentValue: current,
        unit: _unit.text,
        habitId: _habitId,
        deadline: _deadline,
      );
    } else {
      await repo.update(
        kr.copyWith(
          title: _title.text,
          description: _description.text,
          measureType: _type,
          startValue: Value(start),
          targetValue: Value(target),
          currentValue: Value(current),
          unit: Value(_unit.text),
          habitId: Value(_habitId),
          deadline: Value(_deadline),
        ),
      );
    }
    if (mounted) closeForm(context);
  }

  Future<void> _delete() async {
    final kr = _kr!;
    final confirmed = await confirmDelete(
      context,
      title: 'Delete key result?',
      message:
          'This deletes "${kr.title}". Projects and habits linked to it keep '
          'existing without the link.',
    );
    if (!confirmed) return;
    await ref.read(keyResultRepositoryProvider).delete(kr.id);
    if (mounted) closeForm(context);
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
    final editing = _kr != null;
    return FormScaffold(
      formKey: _formKey,
      title: editing ? 'Edit key result' : 'New key result',
      onSave: _save,
      onDelete: editing ? _delete : null,
      deleteTooltip: 'Delete key result',
      children: [
        Text(
          widget.objective.title,
          style: Theme.of(context).textTheme.titleSmall,
        ),
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
            ButtonSegment(value: MeasureType.numeric, label: Text('Numeric')),
            ButtonSegment(value: MeasureType.boolean, label: Text('Yes/no')),
            ButtonSegment(value: MeasureType.habit, label: Text('Habit')),
          ],
          selected: {_type},
          onSelectionChanged: (selection) =>
              setState(() => _type = selection.single),
        ),
        ..._measureFields(),
        DateField(
          label: 'Deadline (optional)',
          value: _deadline,
          clearable: true,
          helperText:
              'Without a deadline: the objective\'s end date, '
              '${formatDate(widget.objective.endDate)}',
          onChanged: (date) => setState(() => _deadline = date),
        ),
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
