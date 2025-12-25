ALTER TABLE `funds` ADD `fundrichCode` varchar(50);--> statement-breakpoint
ALTER TABLE `funds` ADD `lastNavUpdateTime` timestamp;--> statement-breakpoint
CREATE INDEX `fundrichCode_idx` ON `funds` (`fundrichCode`);