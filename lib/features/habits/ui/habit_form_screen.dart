import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/db/app_database.dart';
import '../../../core/widgets/confirm_delete.dart';
import '../../../core/widgets/form_scaffold.dart';
import '../../key_results/data/key_result_repository.dart';
import '../../objectives/data/objective_repository.dart';
import '../../projects/data/project_repository.dart';
import '../data/habit_repository.dart';
import '../domain/habit_schedule.dart';

class HabitFormScreen extends ConsumerWidget {
  const HabitFormScreen({super.key, this.habitId});

  /// Null to create a new habit.
  final String? habitId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final id = habitId;
    return FormLoader<Habit>(
      load: id == null ? null : () => ref.read(habitRepositoryProvider).get(id),
      builder: (habit) => _HabitForm(habit: habit),
    );
  }
}

class _HabitForm extends ConsumerStatefulWidget {
  const _HabitForm({this.habit});

  final Habit? habit;

  @override
  ConsumerState<_HabitForm> createState() => _HabitFormState();
}

class _HabitFormState extends ConsumerState<_HabitForm> {
  final _formKey = GlobalKey<FormState>();
  late final Habit? _habit = widget.habit;
  late final _title = TextEditingController(text: _habit?.title);
  late final _timesPerWeek = TextEditingController(
    text: _habit?.timesPerWeek?.toString() ?? '3',
  );
  late String? _projectId = _habit?.projectId;
  late String? _keyResultId = _habit?.keyResultId;
  late ScheduleType _scheduleType = _habit?.scheduleType ?? ScheduleType.daily;
  late Set<int> _weekdays = {...?_habit?.weekdays};
  late String? _reminderTime = _habit?.reminderTime;
  late bool _active = _habit?.active ?? true;
  String? _weekdayError;

  @override
  void dispose() {
    _title.dispose();
    _timesPerWeek.dispose();
    super.dispose();
  }

  String? _validateTimesPerWeek(String? text) {
    final error = validateHabitSchedule(
      ScheduleType.timesPerWeek,
      timesPerWeek: int.tryParse((text ?? '').trim()),
    );
    return error == null ? null : 'Enter a number from 1 to 7';
  }

  Future<void> _save() async {
    final fieldsValid = _formKey.currentState!.validate();
    final weekdayError =
        validateHabitSchedule(_scheduleType, weekdays: _weekdays) ==
            HabitScheduleError.noWeekday
        ? 'Pick at least one day'
        : null;
    setState(() => _weekdayError = weekdayError);
    if (!fieldsValid || weekdayError != null) return;

    final repo = ref.read(habitRepositoryProvider);
    final timesPerWeek = int.tryParse(_timesPerWeek.text.trim());
    final habit = _habit;
    if (habit == null) {
      await repo.create(
        title: _title.text,
        projectId: _projectId,
        keyResultId: _keyResultId,
        scheduleType: _scheduleType,
        weekdays: _weekdays,
        timesPerWeek: timesPerWeek,
        reminderTime: _reminderTime,
        active: _active,
      );
    } else {
      await repo.update(
        habit.copyWith(
          title: _title.text,
          projectId: Value(_projectId),
          keyResultId: Value(_keyResultId),
          scheduleType: _scheduleType,
          weekdays: Value(_weekdays),
          timesPerWeek: Value(timesPerWeek),
          reminderTime: Value(_reminderTime),
          active: _active,
        ),
      );
    }
    if (mounted) closeForm(context);
  }

  Future<void> _delete() async {
    final habit = _habit!;
    final confirmed = await confirmDelete(
      context,
      title: 'Delete habit?',
      message:
          'This deletes "${habit.title}". Key results measured by it keep '
          'existing without a linked habit.',
    );
    if (!confirmed) return;
    await ref.read(habitRepositoryProvider).delete(habit.id);
    if (mounted) closeForm(context);
  }

  Future<void> _pickReminder() async {
    final current = _reminderTime;
    final picked = await showTimePicker(
      context: context,
      initialTime: current == null
          ? const TimeOfDay(hour: 8, minute: 0)
          : TimeOfDay(
              hour: int.parse(current.substring(0, 2)),
              minute: int.parse(current.substring(3, 5)),
            ),
    );
    if (picked == null) return;
    String two(int v) => v.toString().padLeft(2, '0');
    setState(() => _reminderTime = '${two(picked.hour)}:${two(picked.minute)}');
  }

  List<Widget> _scheduleFields() => switch (_scheduleType) {
    ScheduleType.daily => const [],
    ScheduleType.weekdays => [
      InputDecorator(
        decoration: InputDecoration(
          labelText: 'Days',
          errorText: _weekdayError,
          border: InputBorder.none,
        ),
        child: Wrap(
          spacing: 6,
          runSpacing: 6,
          children: [
            for (var day = 1; day <= 7; day++)
              FilterChip(
                label: Text(weekdayNames[day - 1]),
                selected: _weekdays.contains(day),
                onSelected: (selected) => setState(() {
                  _weekdays = selected
                      ? {..._weekdays, day}
                      : ({..._weekdays}..remove(day));
                  _weekdayError = null;
                }),
              ),
          ],
        ),
      ),
    ],
    ScheduleType.timesPerWeek => [
      TextFormField(
        controller: _timesPerWeek,
        decoration: const InputDecoration(
          labelText: 'Times per week',
          border: OutlineInputBorder(),
        ),
        keyboardType: TextInputType.number,
        validator: _validateTimesPerWeek,
      ),
    ],
  };

  @override
  Widget build(BuildContext context) {
    final editing = _habit != null;
    final projects = ref.watch(allProjectsProvider).value ?? const <Project>[];
    final objectives =
        ref.watch(objectivesProvider).value ?? const <Objective>[];
    final keyResults =
        ref.watch(keyResultsProvider).value ?? const <KeyResult>[];
    final objectivesById = {for (final o in objectives) o.id: o};

    // Offer projects that are not completed and KRs of active objectives,
    // plus the current links.
    final projectOptions = [
      for (final p in projects)
        if (p.status != ProjectStatus.completed || p.id == _projectId) p,
    ];
    final krOptions = [
      for (final kr in keyResults)
        if (objectivesById[kr.objectiveId]?.status == ObjectiveStatus.active ||
            kr.id == _keyResultId)
          kr,
    ];
    final reminder = _reminderTime;

    return FormScaffold(
      formKey: _formKey,
      title: editing ? 'Edit habit' : 'New habit',
      onSave: _save,
      onDelete: editing ? _delete : null,
      deleteTooltip: 'Delete habit',
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
        DropdownButtonFormField<String?>(
          key: ValueKey('project-${projectOptions.length}'),
          initialValue: projectOptions.any((p) => p.id == _projectId)
              ? _projectId
              : null,
          isExpanded: true,
          decoration: const InputDecoration(
            labelText: 'Project (optional)',
            border: OutlineInputBorder(),
          ),
          items: [
            const DropdownMenuItem(value: null, child: Text('No project')),
            for (final p in projectOptions)
              DropdownMenuItem(
                value: p.id,
                child: Text(p.title, overflow: TextOverflow.ellipsis),
              ),
          ],
          onChanged: (id) => setState(() => _projectId = id),
        ),
        DropdownButtonFormField<String?>(
          key: ValueKey('kr-${krOptions.length}'),
          initialValue: krOptions.any((k) => k.id == _keyResultId)
              ? _keyResultId
              : null,
          isExpanded: true,
          decoration: const InputDecoration(
            labelText: 'Key result (optional)',
            border: OutlineInputBorder(),
          ),
          items: [
            const DropdownMenuItem(value: null, child: Text('No key result')),
            for (final kr in krOptions)
              DropdownMenuItem(
                value: kr.id,
                child: Text(
                  '${objectivesById[kr.objectiveId]?.title ?? ''} › '
                  '${kr.title}',
                  overflow: TextOverflow.ellipsis,
                ),
              ),
          ],
          onChanged: (id) => setState(() => _keyResultId = id),
        ),
        SegmentedButton<ScheduleType>(
          segments: const [
            ButtonSegment(value: ScheduleType.daily, label: Text('Daily')),
            ButtonSegment(
              value: ScheduleType.weekdays,
              label: Text('Weekdays'),
            ),
            ButtonSegment(
              value: ScheduleType.timesPerWeek,
              label: Text('Times per week'),
            ),
          ],
          selected: {_scheduleType},
          showSelectedIcon: false,
          onSelectionChanged: (s) => setState(() {
            _scheduleType = s.single;
            _weekdayError = null;
          }),
        ),
        ..._scheduleFields(),
        InkWell(
          onTap: _pickReminder,
          borderRadius: BorderRadius.circular(4),
          child: InputDecorator(
            decoration: InputDecoration(
              labelText: 'Reminder time (optional)',
              helperText: 'Notifications come in a later milestone.',
              border: const OutlineInputBorder(),
              suffixIcon: reminder == null
                  ? const Icon(Icons.schedule)
                  : IconButton(
                      tooltip: 'Clear reminder time',
                      icon: const Icon(Icons.clear),
                      onPressed: () => setState(() => _reminderTime = null),
                    ),
            ),
            isEmpty: reminder == null,
            child: Text(reminder ?? ''),
          ),
        ),
        SwitchListTile(
          title: const Text('Active'),
          value: _active,
          onChanged: (value) => setState(() => _active = value),
        ),
      ],
    );
  }
}
