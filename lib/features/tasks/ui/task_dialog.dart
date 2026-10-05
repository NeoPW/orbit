import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/db/app_database.dart';
import '../../../core/widgets/date_field.dart';
import '../../projects/data/project_repository.dart';
import '../data/task_repository.dart';

/// Adds a task to [projectId], or edits [task] when given. With
/// [asNextStep], the new task becomes the project's next step.
Future<void> showTaskDialog(
  BuildContext context, {
  required String projectId,
  Task? task,
  bool asNextStep = false,
}) => showDialog<void>(
  context: context,
  builder: (context) =>
      _TaskDialog(projectId: projectId, task: task, asNextStep: asNextStep),
);

class _TaskDialog extends ConsumerStatefulWidget {
  const _TaskDialog({
    required this.projectId,
    this.task,
    this.asNextStep = false,
  });

  final String projectId;
  final Task? task;
  final bool asNextStep;

  @override
  ConsumerState<_TaskDialog> createState() => _TaskDialogState();
}

class _TaskDialogState extends ConsumerState<_TaskDialog> {
  late final _title = TextEditingController(text: widget.task?.title);
  late final _notes = TextEditingController(text: widget.task?.notes);
  late CalendarDate? _dueDate = widget.task?.dueDate;
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
        projectId: widget.projectId,
        title: title,
        notes: _notes.text,
        dueDate: _dueDate,
      );
      if (widget.asNextStep) {
        await projects.setNextStep(widget.projectId, created.id);
      }
    } else {
      await repo.update(
        task.copyWith(
          title: title,
          notes: _notes.text,
          dueDate: Value(_dueDate),
        ),
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
