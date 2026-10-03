CREATE TABLE "PostRevision" (
	"id" text PRIMARY KEY NOT NULL,
	"postId" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text DEFAULT '' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"savedBy" text DEFAULT '' NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PostView" (
	"postId" text NOT NULL,
	"day" date NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "PostView_pkey" PRIMARY KEY("postId","day")
);
--> statement-breakpoint
ALTER TABLE "AdminUser" ADD COLUMN "role" text DEFAULT 'admin' NOT NULL;--> statement-breakpoint
ALTER TABLE "AdminUser" ADD COLUMN "displayName" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "AdminUser" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "AdminUser" ADD COLUMN "bio" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "AdminUser" ADD COLUMN "avatar" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "AdminUser" ADD COLUMN "createdAt" timestamp (3) DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "Post" ADD COLUMN "authorId" text;--> statement-breakpoint
ALTER TABLE "PostRevision" ADD CONSTRAINT "PostRevision_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PostView" ADD CONSTRAINT "PostView_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "PostRevision_postId_createdAt_idx" ON "PostRevision" USING btree ("postId","createdAt");--> statement-breakpoint
CREATE INDEX "PostView_day_idx" ON "PostView" USING btree ("day");--> statement-breakpoint
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."AdminUser"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "AdminUser_slug_key" ON "AdminUser" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "Post_authorId_idx" ON "Post" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "Post_search_idx" ON "Post" USING gin ((setweight(to_tsvector('english', "title"), 'A') || setweight(to_tsvector('english', "excerpt"), 'B') || setweight(to_tsvector('english', regexp_replace("content", '<[^>]+>', ' ', 'g')), 'C')));--> statement-breakpoint
-- A blog with a single account: that account wrote every existing post.
UPDATE "Post" SET "authorId" = (SELECT "id" FROM "AdminUser" LIMIT 1) WHERE "authorId" IS NULL AND (SELECT count(*) FROM "AdminUser") = 1;
