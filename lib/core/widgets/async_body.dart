import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Shows [data] once [value] has a value; a spinner while loading and the
/// error otherwise.
class AsyncBody<T> extends StatelessWidget {
  const AsyncBody({super.key, required this.value, required this.data});

  final AsyncValue<T> value;
  final Widget Function(T value) data;

  @override
  Widget build(BuildContext context) {
    final value = this.value;
    if (value.hasValue) return data(value.requireValue);
    if (value.hasError) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text('Something went wrong: ${value.error}'),
        ),
      );
    }
    return const Center(child: CircularProgressIndicator());
  }
}
