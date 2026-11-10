CREATE TABLE `exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`distance_unit` text
);
--> statement-breakpoint
CREATE TABLE `workouts` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`name` text NOT NULL,
	`exercise_ids` text DEFAULT '[]' NOT NULL,
	`project_id` text,
	`goal_id` text,
	`habit_id` text
);
