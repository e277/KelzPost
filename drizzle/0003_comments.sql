CREATE TABLE "Comment" (
	"id" text PRIMARY KEY NOT NULL,
	"postId" text NOT NULL,
	"parentId" text,
	"authorName" text NOT NULL,
	"authorEmail" text DEFAULT '' NOT NULL,
	"content" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"isAuthor" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "Comment_postId_status_createdAt_idx" ON "Comment" USING btree ("postId","status","createdAt");--> statement-breakpoint
CREATE INDEX "Comment_status_createdAt_idx" ON "Comment" USING btree ("status","createdAt");