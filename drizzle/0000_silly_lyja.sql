CREATE TABLE `ops_events` (
	`id` text PRIMARY KEY NOT NULL,
	`operator_hash` text NOT NULL,
	`name` text NOT NULL,
	`date` text NOT NULL,
	`capacity` integer NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ops_lots` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`name` text NOT NULL,
	`capacity` integer NOT NULL,
	`price` integer NOT NULL,
	`accessible` integer NOT NULL,
	`open` integer NOT NULL,
	`updated` text NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `ops_events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_lots_event` ON `ops_lots` (`event_id`);--> statement-breakpoint
CREATE TABLE `ops_passes` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`name` text NOT NULL,
	`lot_id` text,
	`price` integer NOT NULL,
	`status` text NOT NULL,
	`checked` integer NOT NULL,
	`parking` text NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `ops_events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lot_id`) REFERENCES `ops_lots`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_passes_event_status` ON `ops_passes` (`event_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_passes_lot_status` ON `ops_passes` (`lot_id`,`status`,`parking`);