CREATE TABLE "AdminUser" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"passwordHash" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LoginAttempt" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"resetAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Page" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Post" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text DEFAULT '' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"coverImage" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"author" text DEFAULT '' NOT NULL,
	"categoryId" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"publishedAt" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "Settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"blogTitle" text DEFAULT 'The Journal' NOT NULL,
	"tagline" text DEFAULT 'Thoughts, stories, and ideas — written to share.' NOT NULL,
	"logoText" text DEFAULT '' NOT NULL,
	"authorName" text DEFAULT 'Author' NOT NULL,
	"authorBio" text DEFAULT '' NOT NULL,
	"authorAvatar" text DEFAULT '' NOT NULL,
	"accentColor" text DEFAULT '#C8922A' NOT NULL,
	"navyColor" text DEFAULT '#0A1F44' NOT NULL,
	"aboutTitle" text DEFAULT 'About' NOT NULL,
	"aboutContent" text DEFAULT '' NOT NULL,
	"socialTwitter" text DEFAULT '' NOT NULL,
	"socialInstagram" text DEFAULT '' NOT NULL,
	"socialLinkedin" text DEFAULT '' NOT NULL,
	"socialGithub" text DEFAULT '' NOT NULL,
	"navLinks" text DEFAULT '[{"label":"Home","href":"/"},{"label":"About","href":"/about"}]' NOT NULL,
	"heroTag" text DEFAULT 'Personal Blog' NOT NULL,
	"heroLayout" text DEFAULT 'centered' NOT NULL,
	"footerText" text DEFAULT '' NOT NULL,
	"postsLayout" text DEFAULT 'grid' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Post" ADD CONSTRAINT "Post_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "Category_name_key" ON "Category" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "Page_slug_key" ON "Page" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "Post_slug_key" ON "Post" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "Post_status_publishedAt_idx" ON "Post" USING btree ("status","publishedAt");