CREATE TABLE `adminAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(64) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`role` enum('owner','admin') NOT NULL DEFAULT 'admin',
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp,
	CONSTRAINT `adminAccounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `adminAccounts_username_unique` UNIQUE(`username`)
);
