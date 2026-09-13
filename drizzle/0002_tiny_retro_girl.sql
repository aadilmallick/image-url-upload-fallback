CREATE TYPE "public"."image_event_type" AS ENUM('uploaded', 'degraded', 'repair_started', 'replica_repaired', 'repair_failed');--> statement-breakpoint
CREATE TABLE "image_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_id" uuid NOT NULL,
	"type" "image_event_type" NOT NULL,
	"provider" "provider_type",
	"message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "image_events" ADD CONSTRAINT "image_events_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "image_events_image_created" ON "image_events" USING btree ("image_id","created_at");