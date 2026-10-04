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
