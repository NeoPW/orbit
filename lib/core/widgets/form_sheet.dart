import 'package:flutter/material.dart';

import 'empty_state.dart';
import 'two_pane.dart';

/// How a form sheet was closed. Null (from [showFormSheet]) means closed
/// without saving.
enum FormResult { saved, deleted }

/// Opens a create/edit form over the current screen (visual-design spec,
/// "Forms in sheets"): a bottom sheet below [TwoPane.breakpoint], a side
/// sheet on the right from it. The form closes itself with [closeFormSheet].
Future<FormResult?> showFormSheet(
  BuildContext context, {
  required WidgetBuilder builder,
}) {
  if (!TwoPane.isWide(context)) {
    return showModalBottomSheet<FormResult>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      showDragHandle: true,
      constraints: const BoxConstraints(maxWidth: 640),
      builder: (context) => ConstrainedBox(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.sizeOf(context).height * 0.9,
        ),
        child: builder(context),
      ),
    );
  }
  final animate = !MediaQuery.disableAnimationsOf(context);
  return showGeneralDialog<FormResult>(
    context: context,
    barrierDismissible: true,
    barrierLabel: MaterialLocalizations.of(context).modalBarrierDismissLabel,
    barrierColor: Colors.black54,
    transitionDuration: animate
        ? const Duration(milliseconds: 250)
        : Duration.zero,
    pageBuilder: (context, _, _) => Align(
      alignment: Alignment.centerRight,
      child: SizedBox(
        width: sideSheetWidth,
        height: double.infinity,
        child: Material(
          elevation: 1,
          color: Theme.of(context).colorScheme.surfaceContainerLow,
          child: SafeArea(left: false, child: builder(context)),
        ),
      ),
    ),
    transitionBuilder: (context, animation, _, child) => SlideTransition(
      position: Tween(
        begin: const Offset(1, 0),
        end: Offset.zero,
      ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOutCubic)),
      child: child,
    ),
  );
}

/// The width of the side sheet on wide screens.
const sideSheetWidth = 480.0;

/// Closes the form sheet around [context] with [result].
void closeFormSheet(
  BuildContext context, [
  FormResult result = FormResult.saved,
]) => Navigator.of(context).pop(result);

/// The frame of a form in a sheet: title, Delete when editing, Save, and
/// the fields in a scrollable column.
class FormSheetFrame extends StatelessWidget {
  const FormSheetFrame({
    super.key,
    required this.formKey,
    required this.title,
    required this.onSave,
    required this.children,
    this.onDelete,
    this.deleteTooltip = 'Delete',
  });

  final GlobalKey<FormState> formKey;
  final String title;
  final VoidCallback? onSave;
  final VoidCallback? onDelete;
  final String deleteTooltip;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 8, 8),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ),
              if (onDelete != null)
                IconButton(
                  tooltip: deleteTooltip,
                  icon: const Icon(Icons.delete_outline),
                  onPressed: onDelete,
                ),
              const SizedBox(width: 4),
              FilledButton(onPressed: onSave, child: const Text('Save')),
            ],
          ),
        ),
        Flexible(
          child: Form(
            key: formKey,
            child: ListView(
              shrinkWrap: true,
              padding: EdgeInsets.fromLTRB(16, 8, 16, 16 + bottomInset),
              children: [
                for (final (i, child) in children.indexed) ...[
                  if (i > 0) const SizedBox(height: 16),
                  child,
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}

/// Loads the record to edit once, then builds the form inside a sheet. With
/// a null [load] (creating), builds the form right away with null.
class FormSheetLoader<T> extends StatefulWidget {
  const FormSheetLoader({super.key, required this.load, required this.builder});

  final Future<T?> Function()? load;
  final Widget Function(T? record) builder;

  @override
  State<FormSheetLoader<T>> createState() => _FormSheetLoaderState<T>();
}

class _FormSheetLoaderState<T> extends State<FormSheetLoader<T>> {
  late final Future<T?>? _future = widget.load?.call();

  @override
  Widget build(BuildContext context) {
    final future = _future;
    if (future == null) return widget.builder(null);
    return FutureBuilder<T?>(
      future: future,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Padding(
            padding: EdgeInsets.all(32),
            child: Center(child: CircularProgressIndicator()),
          );
        }
        final record = snapshot.data;
        if (record == null) {
          return const Padding(
            padding: EdgeInsets.all(16),
            child: EmptyState(
              icon: Icons.search_off,
              message: 'This item no longer exists',
            ),
          );
        }
        return widget.builder(record);
      },
    );
  }
}
