CREATE TABLE `bankDeposits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bankId` int NOT NULL,
	`userId` int NOT NULL,
	`currencyId` int NOT NULL,
	`amount` decimal(20,6) NOT NULL,
	`costTwd` decimal(20,2),
	`interestRate` decimal(5,4),
	`monthlyInvestment` decimal(20,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bankDeposits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `banks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(20),
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `banks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cryptoHoldings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`exchange` varchar(50) NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`name` varchar(100),
	`amount` decimal(30,10) NOT NULL,
	`stakedAmount` decimal(30,10),
	`avgCost` decimal(20,6),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cryptoHoldings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `currencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(10) NOT NULL,
	`name` varchar(50) NOT NULL,
	`symbol` varchar(10),
	`exchangeRate` decimal(12,6) NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `currencies_id` PRIMARY KEY(`id`),
	CONSTRAINT `currencies_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `fundDividends` (
	`id` int AUTO_INCREMENT NOT NULL,
	`holdingId` int NOT NULL,
	`userId` int NOT NULL,
	`amount` decimal(20,6) NOT NULL,
	`currencyId` int NOT NULL,
	`paymentDate` timestamp NOT NULL,
	`source` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fundDividends_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fundHoldings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bankId` int NOT NULL,
	`fundId` int NOT NULL,
	`units` decimal(20,6) NOT NULL,
	`avgCost` decimal(20,6) NOT NULL,
	`inTransitAmount` decimal(20,2),
	`purchaseDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fundHoldings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `funds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(50),
	`nav` decimal(20,6),
	`currencyId` int NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `funds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stockDividends` (
	`id` int AUTO_INCREMENT NOT NULL,
	`holdingId` int NOT NULL,
	`userId` int NOT NULL,
	`amount` decimal(20,6) NOT NULL,
	`currencyId` int NOT NULL,
	`paymentDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stockDividends_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stockHoldings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bankId` int NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`name` varchar(255),
	`shares` decimal(20,6) NOT NULL,
	`avgCost` decimal(20,6) NOT NULL,
	`currencyId` int NOT NULL,
	`marketType` enum('US','TW') NOT NULL DEFAULT 'US',
	`purchaseDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stockHoldings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`assetType` enum('fund','stock','crypto','deposit') NOT NULL,
	`assetId` int NOT NULL,
	`transactionType` enum('buy','sell','dividend','deposit','withdraw') NOT NULL,
	`amount` decimal(20,6) NOT NULL,
	`price` decimal(20,6),
	`totalValue` decimal(20,2) NOT NULL,
	`currencyId` int NOT NULL,
	`transactionDate` timestamp NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX `userId_idx` ON `bankDeposits` (`userId`);--> statement-breakpoint
CREATE INDEX `bankId_idx` ON `bankDeposits` (`bankId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `banks` (`userId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `cryptoHoldings` (`userId`);--> statement-breakpoint
CREATE INDEX `exchange_idx` ON `cryptoHoldings` (`exchange`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `fundDividends` (`userId`);--> statement-breakpoint
CREATE INDEX `holdingId_idx` ON `fundDividends` (`holdingId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `fundHoldings` (`userId`);--> statement-breakpoint
CREATE INDEX `bankId_idx` ON `fundHoldings` (`bankId`);--> statement-breakpoint
CREATE INDEX `fundId_idx` ON `fundHoldings` (`fundId`);--> statement-breakpoint
CREATE INDEX `code_idx` ON `funds` (`code`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `stockDividends` (`userId`);--> statement-breakpoint
CREATE INDEX `holdingId_idx` ON `stockDividends` (`holdingId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `stockHoldings` (`userId`);--> statement-breakpoint
CREATE INDEX `bankId_idx` ON `stockHoldings` (`bankId`);--> statement-breakpoint
CREATE INDEX `symbol_idx` ON `stockHoldings` (`symbol`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `transactions` (`userId`);--> statement-breakpoint
CREATE INDEX `assetType_idx` ON `transactions` (`assetType`);--> statement-breakpoint
CREATE INDEX `transactionDate_idx` ON `transactions` (`transactionDate`);