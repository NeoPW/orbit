import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/app.dart';
import 'package:orbit/core/messages/messenger.dart';

import '../../helpers/pump_app.dart';

void main() {
  Messenger messenger(WidgetTester tester) =>
      ProviderScope.containerOf(tester.element(find.byType(OrbitApp)))
          .read(messengerProvider.notifier);

  Future<void> show(WidgetTester tester, Message message) async {
    messenger(tester).show(message);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
  }

  testApp('a message appears at the top of the screen', (tester) async {
    await pumpApp(tester);
    await show(tester, Message('Work logged'));
    final top = tester.getTopLeft(find.text('Work logged')).dy;
    expect(top, lessThan(100));
    // Above the floating buttons at the bottom of Home.
    expect(top, lessThan(tester.getTopLeft(find.byTooltip('Log work')).dy));
  });

  testApp('it disappears after 3 seconds', (tester) async {
    await pumpApp(tester);
    await show(tester, Message('Work logged'));
    await tester.pump(const Duration(milliseconds: 2500));
    expect(find.text('Work logged'), findsOneWidget);
    await tester.pump(const Duration(milliseconds: 600));
    await tester.pumpAndSettle();
    expect(find.text('Work logged'), findsNothing);
  });

  testApp('swiping it up dismisses it at once', (tester) async {
    await pumpApp(tester);
    await show(tester, Message('Work logged'));
    await tester.fling(find.text('Work logged'), const Offset(0, -200), 1000);
    await tester.pumpAndSettle();
    expect(find.text('Work logged'), findsNothing);
    expect(messenger(tester).state, isNull);
  });

  testApp('a new message replaces the current one', (tester) async {
    await pumpApp(tester);
    await show(tester, Message('First'));
    await tester.pump(const Duration(seconds: 2));
    await show(tester, Message('Second'));
    await tester.pumpAndSettle();
    expect(find.text('First'), findsNothing);
    expect(find.text('Second'), findsOneWidget);
    // The second message gets its own 3 seconds.
    await tester.pump(const Duration(milliseconds: 1500));
    expect(find.text('Second'), findsOneWidget);
    await tester.pump(const Duration(seconds: 2));
    await tester.pumpAndSettle();
    expect(find.text('Second'), findsNothing);
  });

  testApp('the action runs and closes the message', (tester) async {
    var undone = 0;
    await pumpApp(tester);
    await show(
      tester,
      Message('Task completed', action: MessageAction('Undo', () => undone++)),
    );
    await tester.tap(find.text('Undo'));
    await tester.pumpAndSettle();
    expect(undone, 1);
    expect(find.text('Task completed'), findsNothing);
  });

  testApp('without animations it shows and hides immediately', (tester) async {
    await pumpApp(tester);
    tester.platformDispatcher.accessibilityFeaturesTestValue =
        const FakeAccessibilityFeatures(disableAnimations: true);
    addTearDown(tester.platformDispatcher.clearAccessibilityFeaturesTestValue);
    await tester.pump();
    messenger(tester).show(Message('Work logged'));
    await tester.pump();
    expect(find.text('Work logged'), findsOneWidget);
    messenger(tester).dismiss();
    await tester.pump();
    await tester.pump();
    expect(find.text('Work logged'), findsNothing);
  });
}
