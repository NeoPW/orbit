/// Enumerations stored as text. Each value's [DbEnum.dbValue] is the text
/// written to the database and matches docs/SPEC.md §4.
library;

/// An enum value with a stable text representation in the database.
abstract interface class DbEnum {
  String get dbValue;
}

enum ObjectiveStatus implements DbEnum {
  active('active'),
  completed('completed'),
  archived('archived');

  const ObjectiveStatus(this.dbValue);
  @override
  final String dbValue;
}

enum ProjectStatus implements DbEnum {
  active('active'),
  backlog('backlog'),
  paused('paused'),
  completed('completed');

  const ProjectStatus(this.dbValue);
  @override
  final String dbValue;
}

enum TaskStatus implements DbEnum {
  open('open'),
  done('done');

  const TaskStatus(this.dbValue);
  @override
  final String dbValue;
}

enum MeasureType implements DbEnum {
  numeric('numeric'),
  boolean('boolean'),
  habit('habit');

  const MeasureType(this.dbValue);
  @override
  final String dbValue;
}

enum ScheduleType implements DbEnum {
  daily('daily'),
  weekdays('weekdays'),
  timesPerWeek('times_per_week');

  const ScheduleType(this.dbValue);
  @override
  final String dbValue;
}

enum LogSource implements DbEnum {
  manual('manual'),
  habit('habit'),
  task('task');

  const LogSource(this.dbValue);
  @override
  final String dbValue;
}
