CREATE TABLE "medications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"jid" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "treatments_to_medications" (
	"treatment_id" uuid NOT NULL,
	"medication_id" uuid NOT NULL,
	CONSTRAINT "treatments_to_medications_medication_id_treatment_id_pk" PRIMARY KEY("medication_id","treatment_id")
);
--> statement-breakpoint
ALTER TABLE "treatments_to_medications" ADD CONSTRAINT "treatments_to_medications_treatment_id_treatments_id_fk" FOREIGN KEY ("treatment_id") REFERENCES "public"."treatments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatments_to_medications" ADD CONSTRAINT "treatments_to_medications_medication_id_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE no action ON UPDATE no action;