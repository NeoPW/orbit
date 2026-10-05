import '../../../core/db/app_database.dart';
import '../../../core/time/date_format.dart';

/// "dd-mm-yyyy – dd-mm-yyyy" for the week starting [weekStart].
String formatWeek(CalendarDate weekStart) =>
    formatDateRange(weekStart, weekStart.addDays(6));
