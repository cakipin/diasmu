CREATE TABLE `admins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nbm` text NOT NULL,
	`name` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `asset_permissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`domain_id` integer,
	`user_nbm` text NOT NULL,
	`role` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `domains` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pic_id` integer,
	`domain_name` text NOT NULL,
	`target_ip` text,
	`purpose` text,
	`status` text DEFAULT 'active',
	`tipe_aset` text,
	`detail` text,
	FOREIGN KEY (`pic_id`) REFERENCES `pics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `oauth_clients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`app_name` text NOT NULL,
	`client_id` text NOT NULL,
	`client_secret` text NOT NULL,
	`redirect_uris` text,
	`allow_localhost` integer DEFAULT 0,
	`created_by` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `oauth_clients_client_id_unique` ON `oauth_clients` (`client_id`);--> statement-breakpoint
CREATE TABLE `oauth_codes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`client_id` text NOT NULL,
	`user_email` text NOT NULL,
	`user_name` text,
	`user_nbm` text,
	`user_image` text,
	`redirect_uri` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used` integer DEFAULT 0,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `oauth_codes_code_unique` ON `oauth_codes` (`code`);--> statement-breakpoint
CREATE TABLE `oauth_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`access_token` text NOT NULL,
	`client_id` text NOT NULL,
	`user_email` text NOT NULL,
	`user_name` text,
	`user_nbm` text,
	`user_image` text,
	`expires_at` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `oauth_tokens_access_token_unique` ON `oauth_tokens` (`access_token`);--> statement-breakpoint
CREATE TABLE `pics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nbm` text,
	`name` text NOT NULL,
	`institution` text NOT NULL,
	`email` text,
	`phone` text,
	`surat_tugas` text,
	`surat_permohonan` text,
	`catatan` text,
	`email_instansi` text,
	`status` text DEFAULT 'pending',
	`created_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pics_email_unique` ON `pics` (`email`);--> statement-breakpoint
CREATE TABLE `social_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`platform` text NOT NULL,
	`username` text NOT NULL,
	`registered_email` text NOT NULL,
	`has_2fa` integer DEFAULT 0,
	`pic_id` integer,
	FOREIGN KEY (`pic_id`) REFERENCES `pics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sso_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sso_user_id` text NOT NULL,
	`nbm` text,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`sso_raw_data` text,
	`last_login` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sso_users_sso_user_id_unique` ON `sso_users` (`sso_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `sso_users_email_unique` ON `sso_users` (`email`);--> statement-breakpoint
CREATE TABLE `staff_roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pic_id` integer NOT NULL,
	`user_identifier` text NOT NULL,
	`allowed_type` text DEFAULT 'viewer' NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`pic_id`) REFERENCES `pics`(`id`) ON UPDATE no action ON DELETE no action
);
