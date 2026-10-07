import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit/core/widgets/form_sheet.dart';

import '../../helpers/pump_app.dart';

/// A minimal form: Save stores the title in [saved] and closes the sheet.
class _TitleForm extends StatefulWidget {
  const _TitleForm({required this.saved});

  final List<String> saved;

  @override
  State<_TitleForm> createState() => _TitleFormState();
}

class _TitleFormState extends State<_TitleForm> {
  final _formKey = GlobalKey<FormState>();
  final _title = TextEditingController(text: 'Old');

  @override
  Widget build(BuildContext context) => FormSheetFrame(
    formKey: _formKey,
    title: 'Edit thing',
    onSave: () {
      widget.saved.add(_title.text);
      closeFormSheet(context);
    },
    onDelete: () => closeFormSheet(context, FormResult.deleted),
    children: [
      TextFormField(
        controller: _title,
        decoration: const InputDecoration(labelText: 'Title'),
      ),
    ],
  );
}

void main() {
  final saved = <String>[];
  FormResult? result;
  var closed = false;

  setUp(() {
    saved.clear();
    result = null;
    closed = false;
  });

  Widget opener() => Builder(
    builder: (context) => TextButton(
      onPressed: () async {
        result = await showFormSheet(
          context,
          builder: (_) => _TitleForm(saved: saved),
        );
        closed = true;
      },
      child: const Text('Open'),
    ),
  );

  testApp('at 400 px it opens as a bottom sheet', (tester) async {
    await pumpInScaffold(tester, opener());
    await tester.tap(find.text('Open'));
    await tester.pumpAndSettle();
    expect(find.byType(BottomSheet), findsOneWidget);
    expect(find.text('Edit thing'), findsOneWidget);
    expect(
      tester.getBottomLeft(find.byType(BottomSheet)).dy,
      tester.view.physicalSize.height / tester.view.devicePixelRatio,
    );

    await tester.enterText(find.byType(TextFormField), 'New');
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();
    expect(saved, ['New']);
    expect(result, FormResult.saved);
    expect(find.text('Edit thing'), findsNothing);
  });

  testApp('at 1400 px it opens as a side sheet on the right', (tester) async {
    await pumpInScaffold(tester, opener(), width: 1400);
    await tester.tap(find.text('Open'));
    await tester.pumpAndSettle();
    expect(find.byType(BottomSheet), findsNothing);
    final frame = find.byType(FormSheetFrame);
    expect(tester.getTopRight(frame).dx, 1400);
    expect(tester.getSize(frame).width, sideSheetWidth);

    await tester.tap(find.byTooltip('Delete'));
    await tester.pumpAndSettle();
    expect(result, FormResult.deleted);
  });

  for (final width in [400.0, 1400.0]) {
    testApp('closing without Save at $width px discards the change', (
      tester,
    ) async {
      await pumpInScaffold(tester, opener(), width: width);
      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField), 'New');
      // Tap the dimmed area outside the sheet.
      await tester.tapAt(const Offset(10, 10));
      await tester.pumpAndSettle();
      expect(find.text('Edit thing'), findsNothing);
      expect(closed, isTrue);
      expect(result, isNull);
      expect(saved, isEmpty);
    });
  }
}
