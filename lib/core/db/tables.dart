import 'package:drift/drift.dart';

import 'converters.dart';
import 'enums.dart';

/// Columns shared by every synced table (docs/SPEC.md §4).
///
/// Reference columns (`…_id`) are plain indexed text without SQL foreign
/// keys: rows are only soft-deleted, and sync will apply rows in any order.
mixin SyncColumns on Table {
  /// UUID v4, generated on the client.
  TextColumn get id => text()();

  /// UTC.
  DateTimeColumn get createdAt => dateTime()();

  /// UTC, set on every write.
  DateTimeColumn get updatedAt => dateTime()();

  /// UTC, set when the row is soft-deleted.
  DateTimeColumn get deletedAt => dateTime().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class Areas extends Table with SyncColumns {
  TextColumn get name => text()();

  /// `#RRGGBB`.
  TextColumn get color => text()();
  IntColumn get sortOrder => integer()();
}

@TableIndex(name: 'objectives_status', columns: {#status})
class Objectives extends Table with SyncColumns {
  TextColumn get title => text()();
  TextColumn get description => text().withDefault(const Constant(''))();
  TextColumn get startDate => text().map(const CalendarDateConverter())();
  TextColumn get endDate => text().map(const CalendarDateConverter())();
  TextColumn get status => text().map(
    const DbEnumConverter<ObjectiveStatus>(ObjectiveStatus.values),
  )();
  IntColumn get sortOrder => integer()();
}

@TableIndex(name: 'key_results_objective_id', columns: {#objectiveId})
class KeyResults extends Table with SyncColumns {
  TextColumn get objectiveId => text()();
  TextColumn get title => text()();
  TextColumn get description => text().withDefault(const Constant(''))();
  TextColumn get measureType =>
      text().map(const DbEnumConverter<MeasureType>(MeasureType.values))();

  /// Numeric: start value. Boolean: 0.
  RealColumn get startValue => real().nullable()();

  /// Numeric: target value. Boolean: 1. Habit: number of check-ins.
  RealColumn get targetValue => real().nullable()();

  /// Numeric: current value. Boolean: 1 when achieved, else 0.
  RealColumn get currentValue => real().nullable()();
  TextColumn get unit => text().nullable()();

  /// Numeric: what the − / + buttons change the current value by.
  RealColumn get step => real().withDefault(const Constant(1))();
  TextColumn get habitId => text().nullable()();

  /// Falls back to the objective's end date when null.
  TextColumn get deadline =>
      text().map(const CalendarDateConverter()).nullable()();
  IntColumn get sortOrder => integer()();
}

@TableIndex(name: 'projects_status', columns: {#status})
@TableIndex(name: 'projects_key_result_id', columns: {#keyResultId})
@TableIndex(name: 'projects_area_id', columns: {#areaId})
class Projects extends Table with SyncColumns {
  TextColumn get title => text()();
  TextColumn get description => text().withDefault(const Constant(''))();
  TextColumn get areaId => text().nullable()();
  TextColumn get keyResultId => text().nullable()();
  TextColumn get status =>
      text().map(const DbEnumConverter<ProjectStatus>(ProjectStatus.values))();
  IntColumn get importance =>
      // ignore: recursive_getters
      integer().check(importance.isBetweenValues(1, 5))();
  TextColumn get deadline =>
      text().map(const CalendarDateConverter()).nullable()();
  TextColumn get nextStepTaskId => text().nullable()();
}

@TableIndex(name: 'tasks_project_id', columns: {#projectId})
@TableIndex(name: 'tasks_key_result_id', columns: {#keyResultId})
@TableIndex(name: 'tasks_objective_id', columns: {#objectiveId})
class Tasks extends Table with SyncColumns {
  /// At most one of [projectId], [keyResultId] and [objectiveId] is set;
  /// none means a standalone task.
  TextColumn get projectId => text().nullable()();
  TextColumn get keyResultId => text().nullable()();
  TextColumn get objectiveId => text().nullable()();
  TextColumn get title => text()();
  TextColumn get notes => text().withDefault(const Constant(''))();
  TextColumn get dueDate =>
      text().map(const CalendarDateConverter()).nullable()();
  TextColumn get status =>
      text().map(const DbEnumConverter<TaskStatus>(TaskStatus.values))();
  DateTimeColumn get completedAt => dateTime().nullable()();
}

class Habits extends Table with SyncColumns {
  TextColumn get title => text()();
  TextColumn get projectId => text().nullable()();
  TextColumn get keyResultId => text().nullable()();
  TextColumn get scheduleType =>
      text().map(const DbEnumConverter<ScheduleType>(ScheduleType.values))();

  /// ISO weekdays for [ScheduleType.weekdays].
  TextColumn get weekdays => text().map(const WeekdaysConverter()).nullable()();

  /// For [ScheduleType.timesPerWeek].
  IntColumn get timesPerWeek => integer().nullable()();

  /// Local time of day, `HH:mm`.
  TextColumn get reminderTime => text().nullable()();
  BoolColumn get active => boolean().withDefault(const Constant(true))();
}

class HabitChecks extends Table with SyncColumns {
  TextColumn get habitId => text()();
  TextColumn get date => text().map(const CalendarDateConverter())();
  TextColumn get logEntryId => text().nullable()();

  @override
  List<Set<Column<Object>>> get uniqueKeys => [
    {habitId, date},
  ];
}

@DataClassName('LogEntry')
@TableIndex(name: 'log_entries_occurred_at', columns: {#occurredAt})
@TableIndex(name: 'log_entries_task_id', columns: {#taskId})
class LogEntries extends Table with SyncColumns {
  TextColumn get projectId => text().nullable()();
  TextColumn get keyResultId => text().nullable()();
  TextColumn get taskId => text().nullable()();
  DateTimeColumn get occurredAt => dateTime()();
  IntColumn get durationMinutes => integer().nullable()();
  TextColumn get note => text().withDefault(const Constant(''))();
  TextColumn get source =>
      text().map(const DbEnumConverter<LogSource>(LogSource.values))();
}

class WeeklyReviews extends Table with SyncColumns {
  /// Monday of the week, local date.
  TextColumn get weekStart =>
      text().map(const CalendarDateConverter()).unique()();
  IntColumn get score =>
      // ignore: recursive_getters
      integer().nullable().check(score.isBetweenValues(1, 10))();
  TextColumn get reflection => text().withDefault(const Constant(''))();
  TextColumn get planNextWeek => text().withDefault(const Constant(''))();
  DateTimeColumn get completedAt => dateTime().nullable()();
}

/// A KR's progress when a weekly review was saved, so the next review can
/// show the change (week-summary spec).
@TableIndex(
  name: 'review_kr_snapshots_weekly_review_id',
  columns: {#weeklyReviewId},
)
class ReviewKrSnapshots extends Table with SyncColumns {
  TextColumn get weeklyReviewId => text()();
  TextColumn get keyResultId => text()();

  /// 0–1.
  RealColumn get progress => real()();
}

/// The running work timer (work-timer spec). There is at most one row,
/// with a fixed ID; stopping or discarding soft-deletes it.
@DataClassName('WorkTimer')
class Timers extends Table with SyncColumns {
  /// Exactly one of [projectId] and [taskId] is set.
  TextColumn get projectId => text().nullable()();
  TextColumn get taskId => text().nullable()();
  DateTimeColumn get startedAt => dateTime()();
}

/// Local settings as key-value pairs (docs/SPEC.md §4 "Settings").
///
/// Local-only: no sync columns, and sync (milestone 5) must skip this
/// table. Missing keys mean the default value.
@DataClassName('SettingRow')
class Settings extends Table {
  TextColumn get key => text()();
  TextColumn get value => text()();

  @override
  Set<Column<Object>> get primaryKey => {key};
}
