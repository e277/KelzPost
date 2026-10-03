ALTER TABLE "Page" ADD COLUMN "kind" text DEFAULT 'custom' NOT NULL;--> statement-breakpoint
ALTER TABLE "Page" ADD COLUMN "eyebrow" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "Page" ADD COLUMN "heading" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "Page" ADD COLUMN "subheading" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "Page" ADD COLUMN "seoTitle" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "Page" ADD COLUMN "seoDescription" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "Settings" ADD COLUMN "siteText" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "Page_kind_key" ON "Page" USING btree ("kind") WHERE "Page"."kind" <> 'custom';--> statement-breakpoint
-- Home and About become rows in "Page" (ids "home" and "about"), carrying what used
-- to live in Settings. Existing sites only: a fresh database gets them from the app.
-- A custom page at /about was hidden behind the built-in About page; move it aside.
UPDATE "Page" SET "slug" = "slug" || '-' || left("id", 6) WHERE "slug" IN ('', 'about');--> statement-breakpoint
INSERT INTO "Page" ("id", "kind", "title", "slug", "eyebrow", "content", "createdAt", "updatedAt")
SELECT 'home', 'home', 'Home', '', s."heroTag", '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "Settings" s WHERE s."id" = 1
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "Page" ("id", "kind", "title", "slug", "content", "createdAt", "updatedAt")
SELECT 'about', 'about', COALESCE(NULLIF(s."aboutTitle", ''), 'About'), 'about', s."aboutContent", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "Settings" s WHERE s."id" = 1
ON CONFLICT DO NOTHING;--> statement-breakpoint
ALTER TABLE "Settings" DROP COLUMN "aboutTitle";--> statement-breakpoint
ALTER TABLE "Settings" DROP COLUMN "aboutContent";--> statement-breakpoint
ALTER TABLE "Settings" DROP COLUMN "heroTag";
