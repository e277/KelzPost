CREATE TABLE "Subscriber" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"confirmedAt" timestamp (3)
);
--> statement-breakpoint
ALTER TABLE "Post" ADD COLUMN "newsletterSentAt" timestamp (3);--> statement-breakpoint
CREATE UNIQUE INDEX "Subscriber_email_key" ON "Subscriber" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "Subscriber_token_key" ON "Subscriber" USING btree ("token");--> statement-breakpoint
CREATE INDEX "Subscriber_status_idx" ON "Subscriber" USING btree ("status");