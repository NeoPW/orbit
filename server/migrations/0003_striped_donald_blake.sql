ALTER TABLE `timers` ADD `paused_at` text;--> statement-breakpoint
ALTER TABLE `timers` ADD `worked_seconds` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `timers` ADD `last_entry_id` text;