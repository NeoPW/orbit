import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/db/app_database.dart';
import '../../../core/sync/sync_providers.dart';
import '../../../core/time/date_format.dart';
import '../../../core/widgets/section_heading.dart';
import '../data/account_controller.dart';

/// "Account & sync" in Settings (account and sync specs).
class AccountSection extends ConsumerWidget {
  const AccountSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final account = ref.watch(accountProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionHeading('Account & sync'),
        switch (account.status) {
          AccountStatus.notConfigured => const ListTile(
            leading: Icon(Icons.cloud_off_outlined),
            title: Text('Sync is not configured in this build'),
          ),
          AccountStatus.signedOut => _SignInForm(state: account),
          AccountStatus.signedIn => _SignedIn(email: account.email ?? ''),
        },
      ],
    );
  }
}

/// Asks before the account's data replaces this device's data.
Future<bool> confirmReplaceLocalData(BuildContext context) async {
  final confirmed = await showDialog<bool>(
    context: context,
    barrierDismissible: false,
    builder: (context) => AlertDialog(
      title: const Text('Replace data on this device?'),
      content: const Text(
        'Your account already has data. Signing in replaces everything on '
        'this device with your account\'s data. Data that exists only on '
        'this device is lost; settings stay.',
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () => Navigator.of(context).pop(true),
          child: const Text('Replace'),
        ),
      ],
    ),
  );
  return confirmed ?? false;
}

class _SignInForm extends ConsumerStatefulWidget {
  const _SignInForm({required this.state});

  final AccountState state;

  @override
  ConsumerState<_SignInForm> createState() => _SignInFormState();
}

class _SignInFormState extends ConsumerState<_SignInForm> {
  final _email = TextEditingController();
  final _password = TextEditingController();

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _signIn() => ref
      .read(accountProvider.notifier)
      .signIn(
        email: _email.text,
        password: _password.text,
        confirmReplace: () => confirmReplaceLocalData(context),
      );

  @override
  Widget build(BuildContext context) {
    final error = widget.state.error;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Sign in to sync between your phone and the browser.'),
          const SizedBox(height: 12),
          TextField(
            controller: _email,
            decoration: const InputDecoration(
              labelText: 'Email',
              border: OutlineInputBorder(),
            ),
            keyboardType: TextInputType.emailAddress,
            autofillHints: const [AutofillHints.email],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _password,
            decoration: const InputDecoration(
              labelText: 'Password',
              border: OutlineInputBorder(),
            ),
            obscureText: true,
            autofillHints: const [AutofillHints.password],
            onSubmitted: (_) => _signIn(),
          ),
          if (error != null) ...[
            const SizedBox(height: 8),
            Text(
              error,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ],
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerLeft,
            child: FilledButton(
              onPressed: widget.state.busy ? null : _signIn,
              child: const Text('Sign in'),
            ),
          ),
        ],
      ),
    );
  }
}

class _SignedIn extends ConsumerWidget {
  const _SignedIn({required this.email});

  final String email;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = ref.watch(syncStatusProvider).value;
    final last = status?.lastSuccessAt;
    final lastText = last == null
        ? 'Not synced yet'
        : 'Last synced ${formatDate(CalendarDate.fromDateTime(last))} '
              '${formatTime(last)}';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ListTile(
          leading: const Icon(Icons.account_circle_outlined),
          title: Text(email),
          subtitle: Text(lastText),
        ),
        if (status?.lastFailed ?? false)
          ListTile(
            leading: Icon(
              Icons.sync_problem,
              color: Theme.of(context).colorScheme.error,
            ),
            title: const Text('Last sync failed'),
            subtitle: const Text('It is retried automatically'),
          ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: Wrap(
            spacing: 8,
            children: [
              FilledButton.icon(
                onPressed: () => ref.read(syncServiceProvider).sync(),
                icon: const Icon(Icons.sync),
                label: const Text('Sync now'),
              ),
              OutlinedButton(
                onPressed: () => ref.read(accountProvider.notifier).signOut(),
                child: const Text('Sign out'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
