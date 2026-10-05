import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/db/app_database.dart';
import 'package:orbit/features/tasks/domain/next_step_choice.dart';
import 'package:orbit/features/tasks/ui/next_step_prompt.dart';

final _t0 = DateTime.utc(2026, 10, 1);

Task task(String id, String title) => Task(
  id: id,
  createdAt: _t0,
  updatedAt: _t0,
  projectId: 'p1',
  title: title,
  notes: '',
  status: TaskStatus.open,
);

/// Opens the prompt and returns a future of its result.
Future<Future<NextStepChoice?>> openPrompt(WidgetTester tester) async {
  late Future<NextStepChoice?> result;
  final draft = task('t1', 'Draft outline');
  await tester.pumpWidget(
    MaterialApp(
      home: Scaffold(
        body: Builder(
          builder: (context) => TextButton(
            onPressed: () => result = showNextStepPrompt(
              context,
              done: draft,
              openTasks: [draft, task('t2', 'Book venue')],
            ),
            child: const Text('open'),
          ),
        ),
      ),
    ),
  );
  await tester.tap(find.text('open'));
  await tester.pumpAndSettle();
  return result;
}

void main() {
  testWidgets('a new title returns NewNextStep', (tester) async {
    final result = await openPrompt(tester);
    await tester.enterText(find.byType(TextField), ' Write intro ');
    await tester.tap(find.text('Set next step'));
    await tester.pumpAndSettle();
    expect(await result, const NewNextStep('Write intro'));
  });

  testWidgets('an empty title is not accepted', (tester) async {
    await openPrompt(tester);
    await tester.tap(find.text('Set next step'));
    await tester.pumpAndSettle();
    expect(find.text('Enter a next step, or choose Skip'), findsOneWidget);
  });

  testWidgets('picking an open task returns ExistingNextStep', (tester) async {
    final result = await openPrompt(tester);
    // The completed task itself is not offered.
    expect(find.widgetWithText(ListTile, 'Draft outline'), findsNothing);
    await tester.tap(find.text('Book venue'));
    await tester.pumpAndSettle();
    expect(await result, const ExistingNextStep('t2'));
  });

  testWidgets('skip returns NoNextStep', (tester) async {
    final result = await openPrompt(tester);
    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();
    expect(await result, const NoNextStep());
  });

  testWidgets('cancel returns null', (tester) async {
    final result = await openPrompt(tester);
    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();
    expect(await result, isNull);
  });
}
