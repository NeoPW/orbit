import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../router/routes.dart';
import 'max_width_body.dart';

/// Leaves a form: back to the previous page, or to Plan when the form was
/// opened directly (e.g. after a browser reload).
void closeForm(BuildContext context) {
  if (context.canPop()) {
    context.pop();
  } else {
    context.go(Routes.plan);
  }
}

/// The frame of a create/edit form: title, Save, optional Delete, and the
/// fields in a scrollable, width-limited column.
class FormScaffold extends StatelessWidget {
  const FormScaffold({
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
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: [
          if (onDelete != null)
            IconButton(
              tooltip: deleteTooltip,
              icon: const Icon(Icons.delete_outline),
              onPressed: onDelete,
            ),
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilledButton(onPressed: onSave, child: const Text('Save')),
          ),
        ],
      ),
      body: Form(
        key: formKey,
        child: MaxWidthBody(
          maxWidth: 640,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              for (final (i, child) in children.indexed) ...[
                if (i > 0) const SizedBox(height: 16),
                child,
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// Loads the record to edit once, then builds the form. With a null [load]
/// (creating), builds the form right away with null.
class FormLoader<T> extends StatefulWidget {
  const FormLoader({super.key, required this.load, required this.builder});

  final Future<T?> Function()? load;
  final Widget Function(T? record) builder;

  @override
  State<FormLoader<T>> createState() => _FormLoaderState<T>();
}

class _FormLoaderState<T> extends State<FormLoader<T>> {
  late final Future<T?>? _future = widget.load?.call();

  @override
  Widget build(BuildContext context) {
    final future = _future;
    if (future == null) return widget.builder(null);
    return FutureBuilder<T?>(
      future: future,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        final record = snapshot.data;
        if (record == null) {
          return Scaffold(
            appBar: AppBar(),
            body: const Center(child: Text('This item no longer exists.')),
          );
        }
        return widget.builder(record);
      },
    );
  }
}
