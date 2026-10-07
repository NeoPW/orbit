import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

import '../../helpers/test_db.dart';

/// Columns per table in supabase/schema.sql (without the server-only ones).
Map<String, Set<String>> serverColumns() {
  final sql = File('supabase/schema.sql').readAsStringSync();
  final tables = RegExp(
    r'create table if not exists public\.(\w+) \(\n(.*?)\n\);',
    dotAll: true,
  ).allMatches(sql);
  return {
    for (final table in tables)
      table.group(1)!: {
        for (final line in table.group(2)!.split('\n'))
          line.trim().split(' ').first,
      }..removeAll({'user_id', 'server_updated_at'}),
  };
}

void main() {
  test('the server schema mirrors every synced local table', () async {
    final db = newTestDatabase();
    addTearDown(db.close);
    final local = {
      for (final table in db.allTables)
        if (table.actualTableName != 'settings')
          table.actualTableName: {
            for (final column in table.$columns) column.name,
          },
    };

    expect(local, hasLength(11));
    expect(serverColumns(), local);
  });

  test('local settings have no server table', () {
    expect(serverColumns().containsKey('settings'), isFalse);
  });
}
