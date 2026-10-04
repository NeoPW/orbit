import 'package:drift/drift.dart';

import '../time/calendar_date.dart';
import 'enums.dart';

/// Stores a [DbEnum] as its [DbEnum.dbValue].
class DbEnumConverter<T extends Enum> extends TypeConverter<T, String> {
  const DbEnumConverter(this.values);

  final List<T> values;

  @override
  T fromSql(String fromDb) => values.firstWhere(
    (value) => (value as DbEnum).dbValue == fromDb,
    orElse: () => throw ArgumentError.value(fromDb, 'fromDb', 'Unknown $T'),
  );

  @override
  String toSql(T value) => (value as DbEnum).dbValue;
}

/// Stores a [CalendarDate] as `YYYY-MM-DD`.
class CalendarDateConverter extends TypeConverter<CalendarDate, String> {
  const CalendarDateConverter();

  @override
  CalendarDate fromSql(String fromDb) => CalendarDate.parse(fromDb);

  @override
  String toSql(CalendarDate value) => value.toIso();
}

/// Stores a set of ISO weekdays (Monday = 1) as comma-separated numbers in
/// ascending order, e.g. `"1,3,5"`.
class WeekdaysConverter extends TypeConverter<Set<int>, String> {
  const WeekdaysConverter();

  @override
  Set<int> fromSql(String fromDb) =>
      fromDb.isEmpty ? <int>{} : fromDb.split(',').map(int.parse).toSet();

  @override
  String toSql(Set<int> value) {
    if (value.any((day) => day < DateTime.monday || day > DateTime.sunday)) {
      throw ArgumentError.value(value, 'value', 'Weekdays must be 1–7');
    }
    return (value.toList()..sort()).join(',');
  }
}
