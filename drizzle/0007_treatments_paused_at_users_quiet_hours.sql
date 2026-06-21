ALTER TABLE "treatments" ADD COLUMN "paused_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "quiet_hours_start" varchar(5);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "quiet_hours_end" varchar(5);