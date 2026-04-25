CREATE TABLE "treatments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"medicine_name" varchar(255) NOT NULL,
	"interval_hours" integer NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"treatment_id" uuid NOT NULL,
	"scheduled_time" timestamp with time zone NOT NULL,
	"sent" boolean DEFAULT false NOT NULL,
	"sent_at" timestamp with time zone,
	"confirmed" boolean,
	"confirmed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_treatment_id_treatments_id_fk" FOREIGN KEY ("treatment_id") REFERENCES "public"."treatments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reminders_scheduled_time_idx" ON "reminders" USING btree ("scheduled_time");--> statement-breakpoint
CREATE INDEX "reminders_sent_idx" ON "reminders" USING btree ("sent");--> statement-breakpoint
CREATE INDEX "reminders_treatment_idx" ON "reminders" USING btree ("treatment_id");