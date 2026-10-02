-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "blogTitle" TEXT NOT NULL DEFAULT 'The Journal',
    "tagline" TEXT NOT NULL DEFAULT 'Thoughts, stories, and ideas — written to share.',
    "authorName" TEXT NOT NULL DEFAULT 'Author',
    "authorBio" TEXT NOT NULL DEFAULT '',
    "authorAvatar" TEXT NOT NULL DEFAULT '',
    "accentColor" TEXT NOT NULL DEFAULT '#C8922A',
    "navyColor" TEXT NOT NULL DEFAULT '#0A1F44',
    "aboutTitle" TEXT NOT NULL DEFAULT 'About',
    "aboutContent" TEXT NOT NULL DEFAULT '',
    "socialTwitter" TEXT NOT NULL DEFAULT '',
    "socialInstagram" TEXT NOT NULL DEFAULT '',
    "socialLinkedin" TEXT NOT NULL DEFAULT '',
    "socialGithub" TEXT NOT NULL DEFAULT ''
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "coverImage" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "author" TEXT NOT NULL DEFAULT '',
    "categoryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    CONSTRAINT "Post_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");
