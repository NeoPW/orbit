import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/notifications/notification_scheduler.dart';
import '../../../core/widgets/async_body.dart';
import '../../../core/widgets/max_width_body.dart';
import '../../../core/widgets/section_heading.dart';
import '../data/settings_repository.dart';
import '../domain/app_settings.dart';

/// Reminders on/off, default reminder time and deadline lead time
/// (settings spec).
class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: AsyncBody(
        value: ref.watch(appSettingsProvider),
        data: (settings) => MaxWidthBody(
          child: ListView(
            children: [
              const SectionHeading('Reminders'),
              _RemindersSwitch(enabled: settings.remindersEnabled),
              _DefaultReminderTime(time: settings.defaultReminderTime),
              const SectionHeading('Deadlines'),
              _LeadDaysField(days: settings.deadlineLeadDays),
            ],
          ),
        ),
      ),
    );
  }
}

class _RemindersSwitch extends ConsumerWidget {
  const _RemindersSwitch({required this.enabled});

  final bool enabled;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheduler = ref.watch(notificationSchedulerProvider);
    if (!scheduler.supported) {
      return const ListTile(
        leading: Icon(Icons.notifications_off_outlined),
        title: Text('Reminders are only available on Android'),
      );
    }
    final allowed = ref.watch(notificationsAllowedProvider).value ?? true;
    return SwitchListTile(
      secondary: const Icon(Icons.notifications_outlined),
      title: const Text('Reminders'),
      subtitle: Text(
        enabled && !allowed
            ? 'Blocked in Android settings'
            : 'Habits and deadlines for the next 14 days',
      ),
      value: enabled,
      onChanged: (value) async {
        await ref.read(settingsRepositoryProvider).setRemindersEnabled(value);
        if (value) {
          await scheduler.requestPermission();
          ref.invalidate(notificationsAllowedProvider);
        }
      },
    );
  }
}

class _DefaultReminderTime extends ConsumerWidget {
  const _DefaultReminderTime({required this.time});

  final TimeOfDayValue time;

  Future<void> _pick(BuildContext context, WidgetRef ref) async {
    final repo = ref.read(settingsRepositoryProvider);
    final picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay(hour: time.hour, minute: time.minute),
      builder: (context, child) => MediaQuery(
        data: MediaQuery.of(context).copyWith(alwaysUse24HourFormat: true),
        child: child!,
      ),
    );
    if (picked != null) {
      await repo.setDefaultReminderTime((
        hour: picked.hour,
        minute: picked.minute,
      ));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListTile(
      leading: const Icon(Icons.schedule),
      title: const Text('Default reminder time'),
      subtitle: const Text('For habits without own time and for deadlines'),
      trailing: Text(
        formatTimeOfDay(time),
        style: Theme.of(context).textTheme.titleMedium,
      ),
      onTap: () => _pick(context, ref),
    );
  }
}

class _LeadDaysField extends ConsumerStatefulWidget {
  const _LeadDaysField({required this.days});

  final int days;

  @override
  ConsumerState<_LeadDaysField> createState() => _LeadDaysFieldState();
}

class _LeadDaysFieldState extends ConsumerState<_LeadDaysField> {
  late final _controller = TextEditingController(text: '${widget.days}');
  String? _error;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _changed(String text) {
    final error = switch (validateLeadDays(text)) {
      null => null,
      _ => 'Enter $minLeadDays to $maxLeadDays days',
    };
    setState(() => _error = error);
    if (error == null) {
      ref
          .read(settingsRepositoryProvider)
          .setDeadlineLeadDays(int.parse(text.trim()));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      child: TextField(
        controller: _controller,
        decoration: InputDecoration(
          labelText: 'Deadline lead time',
          helperText: 'Home and reminders warn this many days ahead',
          suffixText: 'days',
          errorText: _error,
          border: const OutlineInputBorder(),
        ),
        keyboardType: TextInputType.number,
        onChanged: _changed,
      ),
    );
  }
}
