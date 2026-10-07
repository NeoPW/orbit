import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/core/router/routes.dart';

import '../../../helpers/pump_app.dart';
import '../../../helpers/seed.dart';
import '../../../helpers/test_db.dart';

void main() {
  late AppDatabase db;
  late Seed seed;
  setUp(() {
    db = newTestDatabase();
    seed = Seed(db);
  });

  testApp('starting at the task URL (reload) shows the task', (tester) async {
    final task = await seed.tasks.create(title: 'Tax return');
    final app = await pumpApp(tester, db: db, location: Routes.task(task.id));
    expect(find.text('Tax return'), findsOneWidget);
    expect(
      app.router.routeInformationProvider.value.uri.path,
      '/tasks/${task.id}',
    );
  });
}
