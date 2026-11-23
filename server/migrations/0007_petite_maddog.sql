CREATE TABLE `exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`distance_unit` text,
	`server_seq` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `exercises_server_seq` ON `exercises` (`server_seq`);--> statement-breakpoint
CREATE TABLE `workouts` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`name` text NOT NULL,
	`exercise_ids` text DEFAULT '[]' NOT NULL,
	`project_id` text,
	`goal_id` text,
	`habit_id` text,
	`server_seq` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `workouts_server_seq` ON `workouts` (`server_seq`);