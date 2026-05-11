ALTER TABLE "users" ADD COLUMN "jid" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medications" ADD CONSTRAINT "medications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatments" DROP COLUMN "jid";--> statement-breakpoint
ALTER TABLE "medications" DROP COLUMN "jid";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_jid_unique" UNIQUE("jid");