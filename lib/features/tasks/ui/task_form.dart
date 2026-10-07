import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/db/app_database.dart';
import '../../../core/messages/messenger.dart';
import '../../../core/router/routes.dart';
import '../../../core/widgets/confirm_delete.dart';
import '../../../core/widgets/date_field.dart';
import '../../../core/widgets/form_sheet.dart';
import '../../projects/data/project_repository.dart';
import '../data/task_repository.dart';
import '../domain/task_assignment.dart';
import 'assignment_picker.dart';

/// Opens the task form in a sheet: a new task (assigned to [projectId], or
/// to [assignment], standalone otherwise), or [task] to edit. With
/// [asNextStep], the new task becomes the project's next step.
Future<FormResult?> showTaskForm(
  BuildContext context, {
  String? projectId,
  TaskAssignment? assignment,
  Task? task,
  bool asNextStep = false,
}) => showFormSheet(
  context,
  builder: (_) => _TaskForm(
    assignment:
        assignment ??
        (task == null
            ? (projectId == null ? const Standalone() : InProject(projectId))
            : TaskAssignment.of(task)),
    task: task,
    asNextStep: asNextStep,
  ),
);

class _TaskForm extends ConsumerStatefulWidget {
  const _TaskForm({
    required this.assignment,
    this.task,
    this.asNextStep = false,
  });

  final TaskAssignment assignment;
  final Task? task;
  final bool asNextStep;

  @override
  ConsumerState<_TaskForm> createState() => _TaskFormState();
}

class _TaskFormState extends ConsumerState<_TaskForm> {
  final _formKey = GlobalKey<FormState>();
  late final _title = TextEditingController(text: widget.task?.title);
  late final _notes = TextEditingController(text: widget.task?.notes);
  late CalendarDate? _dueDate = widget.task?.dueDate;
  late TaskAssignment _assignment = widget.assignment;
  bool _saving = false;

  @override
  void dispose() {
    _title.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_saving || !_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final title = _title.text.trim();
    final repo = ref.read(taskRepositoryProvider);
    final task = widget.task;
    if (task == null) {
      final created = await repo.create(
        assignment: _assignment,
        title: title,
        notes: _notes.text,
        dueDate: _dueDate,
      );
      final projectId = _assignment.projectId;
      if (widget.asNextStep && projectId != null) {
        await ref
            .read(projectRepositoryProvider)
            .setNextStep(projectId, created.id);
      }
      if (!mounted) return;
      // No router when the form is shown on its own (widget tests).
      final router = GoRouter.maybeOf(context);
      showMessage(
        ref,
        'Task "$title" created',
        icon: Icons.add_task,
        action: router == null
            ? null
            : MessageAction('Open', () => router.push(Routes.task(created.id))),
      );
    } else {
      await repo.update(
        task.copyWith(
          title: title,
          notes: _notes.text,
          dueDate: Value(_dueDate),
        ),
        assignment: _assignment,
      );
    }
    if (mounted) closeFormSheet(context);
  }

  Future<void> _delete() async {
    final task = widget.task!;
    final confirmed = await confirmDelete(
      context,
      title: 'Delete task?',
      message: 'This deletes "${task.title}". Its log entries stay.',
    );
    if (!confirmed) return;
    await ref.read(taskRepositoryProvider).delete(task.id);
    if (mounted) closeFormSheet(context, FormResult.deleted);
  }

  @override
  Widget build(BuildContext context) {
    final editing = widget.task != null;
    return FormSheetFrame(
      formKey: _formKey,
      title: editing
          ? 'Edit task'
          : widget.asNextStep
          ? 'New next step'
          : 'New task',
      onSave: _saving ? null : _save,
      onDelete: editing ? _delete : null,
      deleteTooltip: 'Delete task',
      children: [
        TextFormField(
          controller: _title,
          autofocus: !editing,
          decoration: const InputDecoration(labelText: 'Title'),
          textCapitalization: TextCapitalization.sentences,
          validator: (value) =>
              (value ?? '').trim().isEmpty ? 'Enter a title' : null,
          onFieldSubmitted: (_) => _save(),
        ),
        TextFormField(
          controller: _notes,
          decoration: const InputDecoration(labelText: 'Notes (optional)'),
          textCapitalization: TextCapitalization.sentences,
          minLines: 1,
          maxLines: 4,
        ),
        DateField(
          label: 'Deadline',
          value: _dueDate,
          clearable: true,
          onChanged: (date) => setState(() => _dueDate = date),
        ),
        if (!widget.asNextStep)
          AssignmentPicker(
            value: _assignment,
            onChanged: (value) => setState(() => _assignment = value),
          ),
      ],
    );
  }
}
