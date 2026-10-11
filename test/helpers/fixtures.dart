import 'package:orbit/core/db/app_database.dart';

/// Data-class builders for pure-function tests (no database involved).
final _t0 = DateTime.utc(2026, 10, 1);

Area area(String id, {String? name, int sortOrder = 0}) => Area(
  id: id,
  createdAt: _t0,
  updatedAt: _t0,
  name: name ?? id,
  color: '#1E88E5',
  sortOrder: sortOrder,
);

Goal goal(
  String id, {
  String? title,
  GoalStatus status = GoalStatus.active,
  CalendarDate? start,
  CalendarDate? end,
  int sortOrder = 0,
  String? color,
}) => Goal(
  id: id,
  createdAt: _t0,
  updatedAt: _t0,
  title: title ?? id,
  description: '',
  startDate: start ?? CalendarDate(2026, 10, 1),
  endDate: end ?? CalendarDate(2026, 12, 31),
  status: status,
  sortOrder: sortOrder,
  color: color,
);

Measure measure(
  String id, {
  required String goalId,
  String? title,
  MeasureType measureType = MeasureType.numeric,
  double? start = 0,
  double? target = 100,
  double? current = 0,
  double step = 1,
  String? habitId,
  int sortOrder = 0,
}) => Measure(
  id: id,
  createdAt: _t0,
  updatedAt: _t0,
  goalId: goalId,
  title: title ?? id,
  description: '',
  measureType: measureType,
  startValue: start,
  targetValue: target,
  currentValue: current,
  step: step,
  habitId: habitId,
  sortOrder: sortOrder,
);

Project project(
  String id, {
  String? title,
  ProjectStatus status = ProjectStatus.active,
  int importance = 3,
  String? goalId,
  String? areaId,
  CalendarDate? deadline,
  DateTime? completedAt,
}) => Project(
  id: id,
  createdAt: _t0,
  updatedAt: _t0,
  title: title ?? id,
  description: '',
  status: status,
  importance: importance,
  goalId: goalId,
  areaId: areaId,
  deadline: deadline,
  completedAt: completedAt,
);

Habit habit(
  String id, {
  String? title,
  ScheduleType scheduleType = ScheduleType.daily,
  Set<int>? weekdays,
  int? timesPerWeek,
  bool active = true,
  String? projectId,
  String? goalId,
}) => Habit(
  id: id,
  createdAt: _t0,
  updatedAt: _t0,
  title: title ?? id,
  projectId: projectId,
  goalId: goalId,
  scheduleType: scheduleType,
  weekdays: weekdays,
  timesPerWeek: timesPerWeek,
  active: active,
);

Task task(
  String id, {
  String? title,
  String? projectId,
  String? goalId,
  CalendarDate? dueDate,
  TaskStatus status = TaskStatus.open,
  DateTime? completedAt,
}) => Task(
  id: id,
  createdAt: _t0,
  updatedAt: _t0,
  projectId: projectId,
  goalId: goalId,
  title: title ?? id,
  notes: '',
  dueDate: dueDate,
  status: status,
  completedAt: completedAt,
);

HabitCheck habitCheck(String habitId, CalendarDate date) => HabitCheck(
  id: 'check-$habitId-${date.toIso()}',
  createdAt: _t0,
  updatedAt: _t0,
  habitId: habitId,
  date: date,
);

/// A log entry at [at] (local time).
LogEntry logEntry(
  String id, {
  String? projectId,
  String? goalId,
  String? taskId,
  required DateTime at,
  int? minutes,
  LogSource source = LogSource.manual,
}) => LogEntry(
  id: id,
  createdAt: _t0,
  updatedAt: _t0,
  projectId: projectId,
  goalId: goalId,
  taskId: taskId,
  occurredAt: at.toUtc(),
  durationMinutes: minutes,
  note: '',
  source: source,
);
