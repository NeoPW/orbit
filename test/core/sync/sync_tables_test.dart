import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/sync/sync_tables.dart';

import '../../helpers/test_db.dart';

void main() {
  late AppDatabase db;
  late Map<String, SyncTable> tables;
  setUp(() {
    db = newTestDatabase();
    tables = {for (final t in syncTables(db)) t.name: t};
  });
  tearDown(() => db.close());

  test('all entity tables except settings are synced', () {
    expect(tables.keys.toSet(), {
      'areas',
      'objectives',
      'key_results',
      'projects',
      'tasks',
      'habits',
      'habit_checks',
      'log_entries',
      'weekly_reviews',
      'review_kr_snapshots',
    });
    expect(tables['habit_checks']!.naturalKey, ['habit_id', 'date']);
    expect(tables['weekly_reviews']!.naturalKey, ['week_start']);
    expect(tables['projects']!.naturalKey, isEmpty);
  });

  group('habits row', () {
    final local = {
      'id': 'h1',
      'created_at': '2026-10-05T12:00:00.000Z',
      'updated_at': '2026-10-05T12:00:01.000Z',
      'deleted_at': null,
      'title': 'Run',
      'project_id': null,
      'key_result_id': null,
      'schedule_type': 'weekdays',
      'weekdays': '1,3,5',
      'times_per_week': null,
      'reminder_time': '07:30',
      'active': 1,
    };

    test('to the server: booleans become true/false', () {
      final remote = tables['habits']!.toRemote(local);
      expect(remote['active'], true);
      expect(remote['weekdays'], '1,3,5');
      expect(remote['created_at'], '2026-10-05T12:00:00.000Z');
      expect(remote['deleted_at'], isNull);
    });

    test('from the server: +00:00 timestamps and booleans normalized', () {
      final remote = {
        ...tables['habits']!.toRemote(local),
        'active': false,
        'created_at': '2026-10-05T12:00:00+00:00',
        'updated_at': '2026-10-05T12:00:01.123456+00:00',
        'user_id': 'u1',
        'server_updated_at': '2026-10-05T12:00:02+00:00',
      };
      final row = tables['habits']!.toLocal(remote);
      expect(row['active'], 0);
      expect(row['created_at'], '2026-10-05T12:00:00.000Z');
      expect(row['updated_at'], '2026-10-05T12:00:01.123456Z');
      expect(row.containsKey('user_id'), isFalse);
      expect(row.containsKey('server_updated_at'), isFalse);
    });
  });

  test('dates and numbers pass through', () {
    final remote = {
      'id': 'k1',
      'created_at': '2026-10-05T12:00:00+00:00',
      'updated_at': '2026-10-05T12:00:00+00:00',
      'deleted_at': null,
      'objective_id': 'o1',
      'title': 'Run',
      'description': '',
      'measure_type': 'numeric',
      'start_value': 0,
      'target_value': 100.5,
      'current_value': 20,
      'unit': 'km',
      'habit_id': null,
      'deadline': '2026-12-31',
      'sort_order': 0,
    };
    final row = tables['key_results']!.toLocal(remote);
    expect(row['deadline'], '2026-12-31');
    expect(row['target_value'], 100.5);
    expect(row['sort_order'], 0);
  });
}
