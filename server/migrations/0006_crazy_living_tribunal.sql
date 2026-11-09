CREATE TABLE `daily_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`date` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`server_seq` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `daily_notes_server_seq` ON `daily_notes` (`server_seq`);