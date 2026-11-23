CREATE TABLE `session_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`session_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`position` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`session_exercise_id` text NOT NULL,
	`position` integer NOT NULL,
	`reps` integer,
	`weight_kg` real,
	`distance` real,
	`duration_seconds` integer
);
--> statement-breakpoint
CREATE TABLE `workout_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`workout_id` text,
	`name` text NOT NULL,
	`started_at` text NOT NULL,
	`ended_at` text,
	`project_id` text,
	`goal_id` text,
	`habit_id` text,
	`log_entry_id` text
);
