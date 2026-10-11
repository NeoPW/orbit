import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/db/app_database.dart';
import '../../../core/time/date_format.dart';
import '../../../core/widgets/area_dot.dart';
import '../../../core/widgets/confirm_delete.dart';
import '../../../core/widgets/date_field.dart';
import '../../../core/widgets/form_sheet.dart';
import '../../areas/data/area_repository.dart';
import '../../goals/data/goal_repository.dart';
import '../data/project_repository.dart';
import '../domain/project_deadline.dart';
import 'project_labels.dart';

/// Opens the project form in a sheet: a new project, or [projectId].
Future<FormResult?> showProjectForm(
  BuildContext context, {
  String? projectId,
  String? goalId,
}) => showFormSheet(
  context,
  builder: (_) => ProjectFormSheet(projectId: projectId, goalId: goalId),
);

class ProjectFormSheet extends ConsumerWidget {
  const ProjectFormSheet({super.key, this.projectId, this.goalId});

  /// Null to create a new project.
  final String? projectId;

  /// The goal a new project serves, e.g. when added from the goal page.
  final String? goalId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final id = projectId;
    return FormSheetLoader<(Project, String)>(
      load: id == null
          ? null
          : () async {
              final repo = ref.read(projectRepositoryProvider);
              final project = await repo.get(id);
              if (project == null) return null;
              final nextStep = await repo.nextStep(project);
              return (project, nextStep?.title ?? '');
            },
      builder: (loaded) => _ProjectForm(
        project: loaded?.$1,
        nextStep: loaded?.$2 ?? '',
        goalId: goalId,
      ),
    );
  }
}

class _ProjectForm extends ConsumerStatefulWidget {
  const _ProjectForm({
    required this.project,
    required this.nextStep,
    this.goalId,
  });

  final Project? project;
  final String nextStep;
  final String? goalId;

  @override
  ConsumerState<_ProjectForm> createState() => _ProjectFormState();
}

class _ProjectFormState extends ConsumerState<_ProjectForm> {
  final _formKey = GlobalKey<FormState>();
  late final Project? _project = widget.project;
  late final _title = TextEditingController(text: _project?.title);
  late final _description = TextEditingController(text: _project?.description);
  late final _nextStep = TextEditingController(text: widget.nextStep);
  late String? _areaId = _project?.areaId;
  late String? _goalId = _project?.goalId ?? widget.goalId;
  late int _importance = _project?.importance ?? 3;
  late CalendarDate? _deadline = _project?.deadline;
  late ProjectStatus _status = _project?.status ?? ProjectStatus.active;

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _nextStep.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final repo = ref.read(projectRepositoryProvider);
    final project = _project;
    if (project == null) {
      await repo.create(
        title: _title.text,
        description: _description.text,
        areaId: _areaId,
        goalId: _goalId,
        status: _status,
        importance: _importance,
        deadline: _deadline,
        nextStep: _nextStep.text,
      );
    } else {
      await repo.save(
        project.copyWith(
          title: _title.text,
          description: _description.text,
          areaId: Value(_areaId),
          goalId: Value(_goalId),
          status: _status,
          importance: _importance,
          deadline: Value(_deadline),
        ),
        nextStep: _nextStep.text,
      );
    }
    if (mounted) closeFormSheet(context);
  }

  Future<void> _delete() async {
    final project = _project!;
    final confirmed = await confirmDelete(
      context,
      title: 'Delete project?',
      message:
          'This deletes "${project.title}" and its tasks. Habits linked to '
          'it keep existing without the link.',
    );
    if (!confirmed) return;
    await ref.read(projectRepositoryProvider).delete(project.id);
    if (mounted) closeFormSheet(context, FormResult.deleted);
  }

  @override
  Widget build(BuildContext context) {
    final editing = _project != null;
    final areas = ref.watch(areasProvider).value ?? const <Area>[];
    final goals = ref.watch(goalsProvider).value ?? const <Goal>[];

    // Active goals, plus the current one if it is no longer active.
    final goalOptions = [
      for (final g in goals)
        if (g.status == GoalStatus.active || g.id == _goalId) g,
    ];
    final selectedGoal = goalOptions.where((g) => g.id == _goalId).firstOrNull;
    final effective = effectiveProjectDeadline(
      _deadline,
      selectedGoal?.endDate,
    );

    return FormSheetFrame(
      formKey: _formKey,
      title: editing ? 'Edit project' : 'New project',
      onSave: _save,
      onDelete: editing ? _delete : null,
      deleteTooltip: 'Delete project',
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
          minLines: 1,
          maxLines: 4,
        ),
        TextFormField(
          controller: _nextStep,
          decoration: const InputDecoration(
            labelText: 'Next step (optional)',
            hintText: 'The next concrete action',
            border: OutlineInputBorder(),
          ),
          textCapitalization: TextCapitalization.sentences,
        ),
        DropdownButtonFormField<String?>(
          key: ValueKey('area-${areas.length}'),
          initialValue: areas.any((a) => a.id == _areaId) ? _areaId : null,
          decoration: const InputDecoration(
            labelText: 'Area',
            border: OutlineInputBorder(),
          ),
          items: [
            const DropdownMenuItem(value: null, child: Text('No area')),
            for (final area in areas)
              DropdownMenuItem(
                value: area.id,
                child: Row(
                  children: [
                    AreaDot(color: area.color),
                    const SizedBox(width: 8),
                    Text(area.name),
                  ],
                ),
              ),
          ],
          onChanged: (id) => setState(() => _areaId = id),
        ),
        DropdownButtonFormField<String?>(
          key: ValueKey('goal-${goalOptions.length}'),
          initialValue: selectedGoal?.id,
          isExpanded: true,
          decoration: const InputDecoration(
            labelText: 'Goal',
            border: OutlineInputBorder(),
          ),
          items: [
            const DropdownMenuItem(value: null, child: Text('No goal')),
            for (final goal in goalOptions)
              DropdownMenuItem(
                value: goal.id,
                child: Text(goal.title, overflow: TextOverflow.ellipsis),
              ),
          ],
          onChanged: (id) => setState(() => _goalId = id),
        ),
        InputDecorator(
          decoration: const InputDecoration(
            labelText: 'Importance',
            border: InputBorder.none,
          ),
          child: SegmentedButton<int>(
            segments: [
              for (var i = 1; i <= 5; i++)
                ButtonSegment(value: i, label: Text('$i')),
            ],
            selected: {_importance},
            showSelectedIcon: false,
            onSelectionChanged: (s) => setState(() => _importance = s.single),
          ),
        ),
        DateField(
          label: 'Deadline (optional)',
          value: _deadline,
          clearable: true,
          helperText: _deadline == null && effective != null
              ? 'Uses the goal\'s end date: '
                    '${formatDate(effective.date)}'
              : null,
          onChanged: (date) => setState(() => _deadline = date),
        ),
        InputDecorator(
          decoration: const InputDecoration(
            labelText: 'Status',
            border: InputBorder.none,
          ),
          child: SegmentedButton<ProjectStatus>(
            segments: [
              for (final status in ProjectStatus.values)
                ButtonSegment(
                  value: status,
                  label: Text(projectStatusLabel(status)),
                ),
            ],
            selected: {_status},
            showSelectedIcon: false,
            onSelectionChanged: (s) => setState(() => _status = s.single),
          ),
        ),
      ],
    );
  }
}
