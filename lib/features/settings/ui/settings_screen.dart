import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/notifications/notification_scheduler.dart';
import '../../../core/widgets/async_body.dart';
import '../../../core/widgets/max_width_body.dart';
import '../../../core/widgets/section_heading.dart';
import '../../account/ui/account_section.dart';
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
              _TimeTile(
                title: 'Default reminder time',
                subtitle: 'For habits without own time and for deadlines',
                time: settings.defaultReminderTime,
                onPicked: (repo, time) => repo.setDefaultReminderTime(time),
              ),
              const SectionHeading('Weekly review'),
              _ReviewDay(day: settings.reviewDay),
              _TimeTile(
                title: 'Review time',
                subtitle: 'When the weekly review reminder comes',
                time: settings.reviewTime,
                onPicked: (repo, time) => repo.setReviewTime(time),
              ),
              const SectionHeading('Deadlines'),
              _LeadDaysField(days: settings.deadlineLeadDays),
              const AccountSection(),
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

/// A time setting shown as `HH:mm`, changed with a 24-hour time picker.
class _TimeTile extends ConsumerWidget {
  const _TimeTile({
    required this.title,
    required this.subtitle,
    required this.time,
    required this.onPicked,
  });

  final String title;
  final String subtitle;
  final TimeOfDayValue time;
  final Future<void> Function(SettingsRepository repo, TimeOfDayValue time)
  onPicked;

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
      await onPicked(repo, (hour: picked.hour, minute: picked.minute));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListTile(
      leading: const Icon(Icons.schedule),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: Text(
        formatTimeOfDay(time),
        style: Theme.of(context).textTheme.titleMedium,
      ),
      onTap: () => _pick(context, ref),
    );
  }
}

const _weekdayNames = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

class _ReviewDay extends ConsumerWidget {
  const _ReviewDay({required this.day});

  /// ISO weekday.
  final int day;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListTile(
      leading: const Icon(Icons.event_repeat_outlined),
      title: const Text('Review day'),
      trailing: DropdownButton<int>(
        value: day,
        underline: const SizedBox(),
        items: [
          for (var weekday = 1; weekday <= 7; weekday++)
            DropdownMenuItem(
              value: weekday,
              child: Text(_weekdayNames[weekday - 1]),
            ),
        ],
        onChanged: (weekday) {
          if (weekday != null) {
            ref.read(settingsRepositoryProvider).setReviewDay(weekday);
          }
        },
      ),
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
