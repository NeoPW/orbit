import 'package:flutter/material.dart';

import '../../../core/db/app_database.dart';
import '../../../core/time/date_format.dart';
import '../domain/next_step_choice.dart';

/// Asks what the project's next step is once [done] is completed: a new
/// task, one of [openTasks] (other than [done]), or none. Returns null when
/// cancelled, in which case nothing may change.
Future<NextStepChoice?> showNextStepPrompt(
  BuildContext context, {
  required Task done,
  required List<Task> openTasks,
}) => showDialog<NextStepChoice>(
  context: context,
  builder: (context) => _NextStepPrompt(
    done: done,
    openTasks: [
      for (final task in openTasks)
        if (task.id != done.id) task,
    ],
  ),
);

class _NextStepPrompt extends StatefulWidget {
  const _NextStepPrompt({required this.done, required this.openTasks});

  final Task done;
  final List<Task> openTasks;

  @override
  State<_NextStepPrompt> createState() => _NextStepPromptState();
}

class _NextStepPromptState extends State<_NextStepPrompt> {
  final _title = TextEditingController();
  String? _titleError;

  @override
  void dispose() {
    _title.dispose();
    super.dispose();
  }

  void _setNew() {
    final title = _title.text.trim();
    if (title.isEmpty) {
      setState(() => _titleError = 'Enter a next step, or choose Skip');
      return;
    }
    Navigator.of(context).pop(NewNextStep(title));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return AlertDialog(
      title: const Text("What's the next step?"),
      content: SizedBox(
        width: 400,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Completing "${widget.done.title}".'),
              const SizedBox(height: 16),
              TextField(
                controller: _title,
                autofocus: true,
                decoration: InputDecoration(
                  labelText: 'New next step',
                  errorText: _titleError,
                ),
                textCapitalization: TextCapitalization.sentences,
                onChanged: (_) {
                  if (_titleError != null) setState(() => _titleError = null);
                },
                onSubmitted: (_) => _setNew(),
              ),
              if (widget.openTasks.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text('Or pick an open task', style: theme.textTheme.labelLarge),
                for (final task in widget.openTasks)
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.arrow_forward),
                    title: Text(task.title),
                    subtitle: task.dueDate == null
                        ? null
                        : Text('Due ${formatDate(task.dueDate!)}'),
                    onTap: () =>
                        Navigator.of(context).pop(ExistingNextStep(task.id)),
                  ),
              ],
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        TextButton(
          onPressed: () => Navigator.of(context).pop(const NoNextStep()),
          child: const Text('Skip'),
        ),
        FilledButton(onPressed: _setNew, child: const Text('Set next step')),
      ],
    );
  }
}
