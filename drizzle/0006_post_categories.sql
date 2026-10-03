CREATE TABLE "PostCategory" (
	"postId" text NOT NULL,
	"categoryId" text NOT NULL,
	CONSTRAINT "PostCategory_pkey" PRIMARY KEY("postId","categoryId")
);
--> statement-breakpoint
ALTER TABLE "PostCategory" ADD CONSTRAINT "PostCategory_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PostCategory" ADD CONSTRAINT "PostCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "PostCategory_categoryId_idx" ON "PostCategory" USING btree ("categoryId");--> statement-breakpoint
-- Every existing post keeps its one category.
INSERT INTO "PostCategory" ("postId", "categoryId") SELECT "id", "categoryId" FROM "Post" WHERE "categoryId" IS NOT NULL;
