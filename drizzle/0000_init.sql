CREATE TABLE `areas` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`start_date` text,
	`end_date` text,
	`status` text DEFAULT 'active' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`color` text
);
--> statement-breakpoint
CREATE TABLE `habit_checks` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`habit_id` text NOT NULL,
	`date` text NOT NULL,
	`log_entry_id` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `habit_checks_habit_date` ON `habit_checks` (`habit_id`,`date`);--> statement-breakpoint
CREATE TABLE `habits` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`title` text NOT NULL,
	`project_id` text,
	`goal_id` text,
	`schedule_type` text DEFAULT 'daily' NOT NULL,
	`weekdays` text,
	`times_per_week` integer,
	`reminder_time` text,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `log_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`project_id` text,
	`goal_id` text,
	`task_id` text,
	`occurred_at` text NOT NULL,
	`duration_minutes` integer,
	`note` text DEFAULT '' NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `measures` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`goal_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`measure_type` text NOT NULL,
	`start_value` real,
	`target_value` real,
	`current_value` real,
	`unit` text,
	`step` real DEFAULT 1 NOT NULL,
	`habit_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`week_start` text NOT NULL,
	`note` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notes_target_week` ON `notes` (`target_type`,`target_id`,`week_start`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`area_id` text,
	`goal_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`importance` integer DEFAULT 3 NOT NULL,
	`deadline` text,
	`completed_at` text
);
--> statement-breakpoint
CREATE TABLE `review_measure_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`weekly_review_id` text NOT NULL,
	`measure_id` text NOT NULL,
	`progress` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`project_id` text,
	`goal_id` text,
	`title` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`due_date` text,
	`importance` integer,
	`is_next_step` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`completed_at` text
);
--> statement-breakpoint
CREATE TABLE `timers` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`project_id` text,
	`task_id` text,
	`started_at` text NOT NULL,
	`planned_minutes` integer
);
--> statement-breakpoint
CREATE TABLE `weekly_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`week_start` text NOT NULL,
	`score` integer,
	`reflection` text DEFAULT '' NOT NULL,
	`plan_next_week` text DEFAULT '' NOT NULL,
	`completed_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `weekly_reviews_week_start` ON `weekly_reviews` (`week_start`);