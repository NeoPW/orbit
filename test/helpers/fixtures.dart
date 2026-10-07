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

Objective objective(
  String id, {
  String? title,
  ObjectiveStatus status = ObjectiveStatus.active,
  CalendarDate? start,
  CalendarDate? end,
  int sortOrder = 0,
}) => Objective(
  id: id,
  createdAt: _t0,
  updatedAt: _t0,
  title: title ?? id,
  description: '',
  startDate: start ?? CalendarDate(2026, 10, 1),
  endDate: end ?? CalendarDate(2026, 12, 31),
  status: status,
  sortOrder: sortOrder,
);

KeyResult keyResult(
  String id, {
  required String objectiveId,
  String? title,
  MeasureType measureType = MeasureType.numeric,
  double? start = 0,
  double? target = 100,
  double? current = 0,
  CalendarDate? deadline,
  String? habitId,
  int sortOrder = 0,
}) => KeyResult(
  id: id,
  createdAt: _t0,
  updatedAt: _t0,
  objectiveId: objectiveId,
  title: title ?? id,
  description: '',
  measureType: measureType,
  startValue: start,
  targetValue: target,
  currentValue: current,
  habitId: habitId,
  deadline: deadline,
  sortOrder: sortOrder,
);

Project project(
  String id, {
  String? title,
  ProjectStatus status = ProjectStatus.active,
  int importance = 3,
  String? keyResultId,
  String? areaId,
  CalendarDate? deadline,
}) => Project(
  id: id,
  createdAt: _t0,
  updatedAt: _t0,
  title: title ?? id,
  description: '',
  status: status,
  importance: importance,
  keyResultId: keyResultId,
  areaId: areaId,
  deadline: deadline,
);

Habit habit(
  String id, {
  String? title,
  ScheduleType scheduleType = ScheduleType.daily,
  Set<int>? weekdays,
  int? timesPerWeek,
  bool active = true,
  String? projectId,
  String? keyResultId,
}) => Habit(
  id: id,
  createdAt: _t0,
  updatedAt: _t0,
  title: title ?? id,
  projectId: projectId,
  keyResultId: keyResultId,
  scheduleType: scheduleType,
  weekdays: weekdays,
  timesPerWeek: timesPerWeek,
  active: active,
);

Task task(
  String id, {
  String? title,
  String? projectId,
  String? keyResultId,
  String? objectiveId,
  CalendarDate? dueDate,
  TaskStatus status = TaskStatus.open,
}) => Task(
  id: id,
  createdAt: _t0,
  updatedAt: _t0,
  projectId: projectId,
  keyResultId: keyResultId,
  objectiveId: objectiveId,
  title: title ?? id,
  notes: '',
  dueDate: dueDate,
  status: status,
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
  required DateTime at,
  int? minutes,
  LogSource source = LogSource.manual,
}) => LogEntry(
  id: id,
  createdAt: _t0,
  updatedAt: _t0,
  projectId: projectId,
  occurredAt: at.toUtc(),
  durationMinutes: minutes,
  note: '',
  source: source,
);
