import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/db/app_database.dart';
import '../../../core/widgets/confirm_delete.dart';
import '../../../core/widgets/date_field.dart';
import '../../../core/widgets/form_sheet.dart';
import '../data/objective_repository.dart';

/// Opens the objective form in a sheet: a new objective, or [objectiveId].
Future<FormResult?> showObjectiveForm(
  BuildContext context, {
  String? objectiveId,
}) => showFormSheet(
  context,
  builder: (_) => ObjectiveFormSheet(objectiveId: objectiveId),
);

class ObjectiveFormSheet extends ConsumerWidget {
  const ObjectiveFormSheet({super.key, this.objectiveId});

  /// Null to create a new objective.
  final String? objectiveId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final id = objectiveId;
    return FormSheetLoader<Objective>(
      load: id == null
          ? null
          : () => ref.read(objectiveRepositoryProvider).get(id),
      builder: (objective) => _ObjectiveForm(objective: objective),
    );
  }
}

class _ObjectiveForm extends ConsumerStatefulWidget {
  const _ObjectiveForm({this.objective});

  final Objective? objective;

  @override
  ConsumerState<_ObjectiveForm> createState() => _ObjectiveFormState();
}

class _ObjectiveFormState extends ConsumerState<_ObjectiveForm> {
  final _formKey = GlobalKey<FormState>();
  late final _title = TextEditingController(text: widget.objective?.title);
  late final _description = TextEditingController(
    text: widget.objective?.description,
  );
  late CalendarDate? _start = widget.objective?.startDate;
  late CalendarDate? _end = widget.objective?.endDate;
  late ObjectiveStatus _status =
      widget.objective?.status ?? ObjectiveStatus.active;
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

    final repo = ref.read(objectiveRepositoryProvider);
    final objective = widget.objective;
    if (objective == null) {
      await repo.create(
        title: _title.text,
        description: _description.text,
        startDate: _start!,
        endDate: _end!,
      );
    } else {
      await repo.update(
        objective.copyWith(
          title: _title.text,
          description: _description.text,
          startDate: _start,
          endDate: _end,
          status: _status,
        ),
      );
    }
    if (mounted) closeFormSheet(context);
  }

  Future<void> _delete() async {
    final objective = widget.objective!;
    final repo = ref.read(objectiveRepositoryProvider);
    final krCount = await repo.countKeyResults(objective.id);
    if (!mounted) return;
    final keyResults = krCount == 1 ? '1 key result' : '$krCount key results';
    final confirmed = await confirmDelete(
      context,
      title: 'Delete objective?',
      message:
          'This deletes "${objective.title}" and its $keyResults. Projects '
          'and habits linked to those key results keep existing without '
          'the link.',
    );
    if (!confirmed) return;
    await repo.delete(objective.id);
    if (mounted) closeFormSheet(context, FormResult.deleted);
  }

  @override
  Widget build(BuildContext context) {
    final editing = widget.objective != null;
    return FormSheetFrame(
      formKey: _formKey,
      title: editing ? 'Edit objective' : 'New objective',
      onSave: _save,
      onDelete: editing ? _delete : null,
      deleteTooltip: 'Delete objective',
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
        if (editing)
          SegmentedButton<ObjectiveStatus>(
            segments: const [
              ButtonSegment(
                value: ObjectiveStatus.active,
                label: Text('Active'),
              ),
              ButtonSegment(
                value: ObjectiveStatus.completed,
                label: Text('Completed'),
              ),
              ButtonSegment(
                value: ObjectiveStatus.archived,
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
