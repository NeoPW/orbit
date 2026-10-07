import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/db/app_database.dart';
import '../../../core/widgets/date_field.dart';
import '../../projects/data/project_repository.dart';
import '../data/task_repository.dart';
import '../domain/task_assignment.dart';
import 'assignment_picker.dart';

/// Adds a task (assigned to [projectId], or to [assignment]), or edits
/// [task] when given. With [asNextStep], the new task becomes the
/// project's next step.
Future<void> showTaskDialog(
  BuildContext context, {
  String? projectId,
  TaskAssignment? assignment,
  Task? task,
  bool asNextStep = false,
}) => showDialog<void>(
  context: context,
  builder: (context) => _TaskDialog(
    assignment:
        assignment ??
        (task == null
            ? (projectId == null ? const Standalone() : InProject(projectId))
            : TaskAssignment.of(task)),
    task: task,
    asNextStep: asNextStep,
  ),
);

class _TaskDialog extends ConsumerStatefulWidget {
  const _TaskDialog({
    required this.assignment,
    this.task,
    this.asNextStep = false,
  });

  final TaskAssignment assignment;
  final Task? task;
  final bool asNextStep;

  @override
  ConsumerState<_TaskDialog> createState() => _TaskDialogState();
}

class _TaskDialogState extends ConsumerState<_TaskDialog> {
  late final _title = TextEditingController(text: widget.task?.title);
  late final _notes = TextEditingController(text: widget.task?.notes);
  late CalendarDate? _dueDate = widget.task?.dueDate;
  late TaskAssignment _assignment = widget.assignment;
  String? _titleError;
  bool _saving = false;

  @override
  void dispose() {
    _title.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final title = _title.text.trim();
    if (title.isEmpty) {
      setState(() => _titleError = 'Enter a title');
      return;
    }
    setState(() => _saving = true);
    final repo = ref.read(taskRepositoryProvider);
    final task = widget.task;
    if (task == null) {
      final projects = ref.read(projectRepositoryProvider);
      final created = await repo.create(
        assignment: _assignment,
        title: title,
        notes: _notes.text,
        dueDate: _dueDate,
      );
      final projectId = _assignment.projectId;
      if (widget.asNextStep && projectId != null) {
        await projects.setNextStep(projectId, created.id);
      }
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
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(
        widget.task != null
            ? 'Edit task'
            : widget.asNextStep
            ? 'New next step'
            : 'New task',
      ),
      content: SizedBox(
        width: 360,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _title,
              autofocus: true,
              decoration: InputDecoration(
                labelText: 'Title',
                errorText: _titleError,
              ),
              textCapitalization: TextCapitalization.sentences,
              onChanged: (_) {
                if (_titleError != null) setState(() => _titleError = null);
              },
              onSubmitted: (_) => _save(),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _notes,
              decoration: const InputDecoration(labelText: 'Notes'),
              textCapitalization: TextCapitalization.sentences,
              minLines: 1,
              maxLines: 4,
            ),
            const SizedBox(height: 16),
            DateField(
              label: 'Due date',
              value: _dueDate,
              clearable: true,
              onChanged: (date) => setState(() => _dueDate = date),
            ),
            if (!widget.asNextStep) ...[
              const SizedBox(height: 16),
              AssignmentPicker(
                value: _assignment,
                onChanged: (value) => setState(() => _assignment = value),
              ),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _saving ? null : _save,
          child: const Text('Save'),
        ),
      ],
    );
  }
}
