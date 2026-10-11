import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/db/app_database.dart';
import '../../../core/widgets/confirm_delete.dart';
import '../../../core/widgets/date_field.dart';
import '../../../core/widgets/form_sheet.dart';
import '../../../core/widgets/planet_color_picker.dart';
import '../../../core/space/space_colors.dart';
import '../data/goal_repository.dart';

/// Opens the goal form in a sheet: a new goal, or [goalId].
Future<FormResult?> showGoalForm(BuildContext context, {String? goalId}) =>
    showFormSheet(context, builder: (_) => GoalFormSheet(goalId: goalId));

class GoalFormSheet extends ConsumerWidget {
  const GoalFormSheet({super.key, this.goalId});

  /// Null to create a new goal.
  final String? goalId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final id = goalId;
    return FormSheetLoader<Goal>(
      load: id == null ? null : () => ref.read(goalRepositoryProvider).get(id),
      builder: (goal) => _GoalForm(goal: goal),
    );
  }
}

class _GoalForm extends ConsumerStatefulWidget {
  const _GoalForm({this.goal});

  final Goal? goal;

  @override
  ConsumerState<_GoalForm> createState() => _GoalFormState();
}

class _GoalFormState extends ConsumerState<_GoalForm> {
  final _formKey = GlobalKey<FormState>();
  late final _title = TextEditingController(text: widget.goal?.title);
  late final _description = TextEditingController(
    text: widget.goal?.description,
  );
  late CalendarDate? _start = widget.goal?.startDate;
  late CalendarDate? _end = widget.goal?.endDate;
  late String? _color = widget.goal?.color;
  late GoalStatus _status = widget.goal?.status ?? GoalStatus.active;
  String? _startError;
  String? _endError;

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    super.dispose();
  }

  bool _validateDates() {
    setState(() {
      _startError = _start == null ? 'Pick a start date' : null;
      _endError = _end == null
          ? 'Pick an end date'
          : (_start != null && _end!.isBefore(_start!))
          ? 'The end date must not be before the start date'
          : null;
    });
    return _startError == null && _endError == null;
  }

  Future<void> _save() async {
    final fieldsValid = _formKey.currentState!.validate();
    final datesValid = _validateDates();
    if (!fieldsValid || !datesValid) return;

    final repo = ref.read(goalRepositoryProvider);
    final goal = widget.goal;
    if (goal == null) {
      await repo.create(
        title: _title.text,
        description: _description.text,
        startDate: _start!,
        endDate: _end!,
        color: _color,
      );
    } else {
      await repo.update(
        goal.copyWith(
          title: _title.text,
          description: _description.text,
          startDate: _start,
          endDate: _end,
          status: _status,
          color: Value(_color),
        ),
      );
    }
    if (mounted) closeFormSheet(context);
  }

  Future<void> _delete() async {
    final deleted = await deleteGoal(context, ref, widget.goal!);
    if (deleted && mounted) closeFormSheet(context, FormResult.deleted);
  }

  @override
  Widget build(BuildContext context) {
    final editing = widget.goal != null;
    return FormSheetFrame(
      formKey: _formKey,
      title: editing ? 'Edit goal' : 'New goal',
      onSave: _save,
      onDelete: editing ? _delete : null,
      deleteTooltip: 'Delete goal',
      children: [
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
          minLines: 2,
          maxLines: 5,
        ),
        DateField(
          label: 'Start date',
          value: _start,
          errorText: _startError,
          onChanged: (date) => setState(() => _start = date),
        ),
        DateField(
          label: 'End date',
          value: _end,
          errorText: _endError,
          onChanged: (date) => setState(() => _end = date),
        ),
        PlanetColorPicker(
          label: 'Planet color',
          value: _color,
          onChanged: (color) => setState(() => _color = color),
          // A new goal goes last; its automatic color follows from
          // there, which the sheet does not know: preview the first.
          auto: widget.goal == null
              ? autoColors.first
              : goalColor(widget.goal!.sortOrder),
        ),
        if (editing)
          SegmentedButton<GoalStatus>(
            segments: const [
              ButtonSegment(value: GoalStatus.active, label: Text('Active')),
              ButtonSegment(
                value: GoalStatus.completed,
                label: Text('Completed'),
              ),
              ButtonSegment(
                value: GoalStatus.archived,
                label: Text('Archived'),
              ),
            ],
            selected: {_status},
            onSelectionChanged: (selection) =>
                setState(() => _status = selection.single),
          ),
      ],
    );
  }
}

/// Asks to delete [goal] and its measures (goals spec, "Delete goal together
/// with its measures") and deletes them; true when deleted.
Future<bool> deleteGoal(BuildContext context, WidgetRef ref, Goal goal) async {
  final repo = ref.read(goalRepositoryProvider);
  final count = await repo.countMeasures(goal.id);
  if (!context.mounted) return false;
  final measures = count == 1 ? '1 measure' : '$count measures';
  final confirmed = await confirmDelete(
    context,
    title: 'Delete goal?',
    message:
        'This deletes "${goal.title}" and its $measures. Projects, tasks '
        'and habits of the goal keep existing without the link.',
  );
  if (!confirmed) return false;
  await repo.delete(goal.id);
  return true;
}
