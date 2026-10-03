import { relations } from "drizzle-orm";
import { foreignKey, index, integer, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () => timestamp("createdAt", { precision: 3, mode: "date" }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updatedAt", { precision: 3, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date());

export const adminUsers = pgTable(
  "AdminUser",
  {
    id: id(),
    username: text("username").notNull(),
    passwordHash: text("passwordHash").notNull(),
  },
  (t) => [uniqueIndex("AdminUser_username_key").on(t.username)]
);

export const settings = pgTable("Settings", {
  id: integer("id").primaryKey().default(1),
  blogTitle: text("blogTitle").notNull().default("The Journal"),
  tagline: text("tagline").notNull().default("Thoughts, stories, and ideas — written to share."),
  logoText: text("logoText").notNull().default(""),
  authorName: text("authorName").notNull().default("Author"),
  authorBio: text("authorBio").notNull().default(""),
  authorAvatar: text("authorAvatar").notNull().default(""),
  accentColor: text("accentColor").notNull().default("#C8922A"),
  navyColor: text("navyColor").notNull().default("#0A1F44"),
  aboutTitle: text("aboutTitle").notNull().default("About"),
  aboutContent: text("aboutContent").notNull().default(""),
  socialTwitter: text("socialTwitter").notNull().default(""),
  socialInstagram: text("socialInstagram").notNull().default(""),
  socialLinkedin: text("socialLinkedin").notNull().default(""),
  socialGithub: text("socialGithub").notNull().default(""),
  navLinks: text("navLinks")
    .notNull()
    .default('[{"label":"Home","href":"/"},{"label":"About","href":"/about"}]'),
  heroTag: text("heroTag").notNull().default("Personal Blog"),
  heroLayout: text("heroLayout").notNull().default("centered"),
  footerText: text("footerText").notNull().default(""),
  postsLayout: text("postsLayout").notNull().default("grid"),
});

export const pages = pgTable(
  "Page",
  {
    id: id(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    content: text("content").notNull().default(""),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("Page_slug_key").on(t.slug)]
);

export const categories = pgTable(
  "Category",
  {
    id: id(),
    name: text("name").notNull(),
    order: integer("order").notNull().default(0),
  },
  (t) => [uniqueIndex("Category_name_key").on(t.name)]
);

export const posts = pgTable(
  "Post",
  {
    id: id(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    content: text("content").notNull().default(""),
    coverImage: text("coverImage").notNull().default(""),
    status: text("status").notNull().default("draft"),
    author: text("author").notNull().default(""),
    categoryId: text("categoryId"),
    // Optional overrides for search engines and link previews.
    seoTitle: text("seoTitle").notNull().default(""),
    seoDescription: text("seoDescription").notNull().default(""),
    ogImage: text("ogImage").notNull().default(""),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    publishedAt: timestamp("publishedAt", { precision: 3, mode: "date" }),
  },
  (t) => [
    uniqueIndex("Post_slug_key").on(t.slug),
    index("Post_status_publishedAt_idx").on(t.status, t.publishedAt),
    foreignKey({ name: "Post_categoryId_fkey", columns: [t.categoryId], foreignColumns: [categories.id] })
      .onDelete("set null")
      .onUpdate("cascade"),
  ]
);

export const tags = pgTable(
  "Tag",
  {
    id: id(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
  },
  (t) => [uniqueIndex("Tag_slug_key").on(t.slug)]
);

export const postTags = pgTable(
  "PostTag",
  {
    postId: text("postId").notNull(),
    tagId: text("tagId").notNull(),
  },
  (t) => [
    primaryKey({ name: "PostTag_pkey", columns: [t.postId, t.tagId] }),
    index("PostTag_tagId_idx").on(t.tagId),
    foreignKey({ name: "PostTag_postId_fkey", columns: [t.postId], foreignColumns: [posts.id] }).onDelete("cascade"),
    foreignKey({ name: "PostTag_tagId_fkey", columns: [t.tagId], foreignColumns: [tags.id] }).onDelete("cascade"),
  ]
);

// Failed-login counters for rate limiting. Stored in the database so limits
// hold across serverless instances.
export const loginAttempts = pgTable("LoginAttempt", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  resetAt: timestamp("resetAt", { precision: 3, mode: "date" }).notNull(),
});

export const postsRelations = relations(posts, ({ one, many }) => ({
  category: one(categories, { fields: [posts.categoryId], references: [categories.id] }),
  postTags: many(postTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  postTags: many(postTags),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, { fields: [postTags.postId], references: [posts.id] }),
  tag: one(tags, { fields: [postTags.tagId], references: [tags.id] }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  posts: many(posts),
}));

export type AdminUser = typeof adminUsers.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type PostWithCategory = Post & { category: Category | null };
