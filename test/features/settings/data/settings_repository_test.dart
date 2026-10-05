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

    expect(
      await repo.watch().first,
      const AppSettings(
        remindersEnabled: false,
        defaultReminderTime: (hour: 7, minute: 15),
        deadlineLeadDays: 3,
      ),
    );
  });

  test('setting a value again replaces it', () async {
    await repo.setDeadlineLeadDays(3);
    await repo.setDeadlineLeadDays(10);

    expect((await repo.watch().first).deadlineLeadDays, 10);
    expect(await db.select(db.settings).get(), hasLength(1));
  });

  test('watch emits after a change', () async {
    final values = repo.watch().map((s) => s.deadlineLeadDays);
    final expectation = expectLater(values, emitsInOrder([7, 3]));
    await Future<void>.delayed(Duration.zero);
    await repo.setDeadlineLeadDays(3);
    await expectation;
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
}
