import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/features/settings/data/settings_repository.dart';
import 'package:orbit/features/settings/domain/app_settings.dart';

import '../../../helpers/test_db.dart';

void main() {
  late AppDatabase db;
  late SettingsRepository repo;
  setUp(() {
    db = newTestDatabase();
    repo = SettingsRepository(db);
  });
  tearDown(() => db.close());

  test('an empty table gives the defaults', () async {
    expect(await repo.watch().first, const AppSettings());
  });

  test('each setter stores its value', () async {
    await repo.setRemindersEnabled(false);
    await repo.setDefaultReminderTime((hour: 7, minute: 15));
    await repo.setDeadlineLeadDays(3);
    await repo.setReviewDay(DateTime.saturday);
    await repo.setReviewTime((hour: 10, minute: 0));

    expect(
      await repo.watch().first,
      const AppSettings(
        remindersEnabled: false,
        defaultReminderTime: (hour: 7, minute: 15),
        deadlineLeadDays: 3,
        reviewDay: DateTime.saturday,
        reviewTime: (hour: 10, minute: 0),
      ),
    );
  });

  test('an unreadable stored value reads as its default', () async {
    await db
        .into(db.settings)
        .insert(
          SettingsCompanion.insert(
            key: SettingKeys.deadlineLeadDays,
            value: 'soon',
          ),
        );
    expect((await repo.watch().first).deadlineLeadDays, 7);
  });

  test('a pinned space image is stored and cleared', () async {
    expect(await repo.watchPinnedSpaceImage().first, isNull);
    await repo.setPinnedSpaceImage('crab_nebula');
    expect(await repo.watchPinnedSpaceImage().first, 'crab_nebula');
    await repo.setPinnedSpaceImage(null);
    expect(await repo.watchPinnedSpaceImage().first, isNull);
  });
}
