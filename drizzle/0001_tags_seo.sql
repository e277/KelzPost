CREATE TABLE "PostTag" (
	"postId" text NOT NULL,
	"tagId" text NOT NULL,
	CONSTRAINT "PostTag_pkey" PRIMARY KEY("postId","tagId")
);
--> statement-breakpoint
CREATE TABLE "Tag" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Post" ADD COLUMN "seoTitle" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "Post" ADD COLUMN "seoDescription" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "Post" ADD COLUMN "ogImage" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "PostTag" ADD CONSTRAINT "PostTag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PostTag" ADD CONSTRAINT "PostTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "PostTag_tagId_idx" ON "PostTag" USING btree ("tagId");--> statement-breakpoint
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag" USING btree ("slug");