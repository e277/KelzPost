-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "blogTitle" TEXT NOT NULL DEFAULT 'The Journal',
    "tagline" TEXT NOT NULL DEFAULT 'Thoughts, stories, and ideas — written to share.',
    "logoText" TEXT NOT NULL DEFAULT '',
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
    "socialGithub" TEXT NOT NULL DEFAULT '',
    "navLinks" TEXT NOT NULL DEFAULT '[{"label":"Home","href":"/"},{"label":"About","href":"/about"}]',
    "heroTag" TEXT NOT NULL DEFAULT 'Personal Blog',
    "heroLayout" TEXT NOT NULL DEFAULT 'centered',
    "footerText" TEXT NOT NULL DEFAULT '',
    "postsLayout" TEXT NOT NULL DEFAULT 'grid'
);
INSERT INTO "new_Settings" ("aboutContent", "aboutTitle", "accentColor", "authorAvatar", "authorBio", "authorName", "blogTitle", "id", "navyColor", "socialGithub", "socialInstagram", "socialLinkedin", "socialTwitter", "tagline") SELECT "aboutContent", "aboutTitle", "accentColor", "authorAvatar", "authorBio", "authorName", "blogTitle", "id", "navyColor", "socialGithub", "socialInstagram", "socialLinkedin", "socialTwitter", "tagline" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
