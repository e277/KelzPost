-- The post editor used to copy the Settings author name into every post, so
-- posts kept the generic "Author" (or an old name) after Settings changed.
-- An empty Post.author now means "use the author name from Settings".
UPDATE "Post" SET "author" = ''
WHERE "author" = 'Author'
   OR "author" = (SELECT "authorName" FROM "Settings" WHERE "id" = 1);
