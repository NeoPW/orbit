CREATE TABLE `measure_changes` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`measure_id` text NOT NULL,
	`from_value` real,
	`to_value` real NOT NULL
);
