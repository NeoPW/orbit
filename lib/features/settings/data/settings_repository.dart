import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/db/app_database.dart';
import '../../../core/db/database_providers.dart';
import '../domain/app_settings.dart';

part 'settings_repository.g.dart';

/// Local settings, stored as key-value rows. Not synced, so no IDs,
/// timestamps or soft deletes.
class SettingsRepository {
  SettingsRepository(this.db);

  final AppDatabase db;

  Stream<AppSettings> watch() => db
      .select(db.settings)
      .watch()
      .map(
        (rows) => AppSettings.fromStored({
          for (final row in rows) row.key: row.value,
        }),
      );

  Future<void> setRemindersEnabled(bool enabled) =>
      _set(SettingKeys.remindersEnabled, enabled.toString());

  Future<void> setDefaultReminderTime(TimeOfDayValue time) =>
      _set(SettingKeys.defaultReminderTime, formatTimeOfDay(time));

  Future<void> setDeadlineLeadDays(int days) =>
      _set(SettingKeys.deadlineLeadDays, days.toString());

  /// [weekday] is an ISO weekday (Monday = 1).
  Future<void> setReviewDay(int weekday) =>
      _set(SettingKeys.reviewDay, weekday.toString());

  Future<void> setReviewTime(TimeOfDayValue time) =>
      _set(SettingKeys.reviewTime, formatTimeOfDay(time));

  Future<void> _set(String key, String value) => db
      .into(db.settings)
      .insertOnConflictUpdate(SettingsCompanion.insert(key: key, value: value));
}

@Riverpod(keepAlive: true)
SettingsRepository settingsRepository(Ref ref) =>
    SettingsRepository(ref.watch(appDatabaseProvider));

/// The current settings.
@riverpod
Stream<AppSettings> appSettings(Ref ref) =>
    ref.watch(settingsRepositoryProvider).watch();
