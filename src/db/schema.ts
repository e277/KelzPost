import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

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

// People who can sign in to the admin. "admin" can do everything; "author"
// can only write and manage their own posts. The profile fields are shown on
// their posts; a blank display name falls back to the About page author name.
export const adminUsers = pgTable(
  "AdminUser",
  {
    id: id(),
    username: text("username").notNull(),
    passwordHash: text("passwordHash").notNull(),
    role: text("role").notNull().default("admin"),
    displayName: text("displayName").notNull().default(""),
    // Public URL of the author page (/author/<slug>); set from the display name.
    slug: text("slug"),
    bio: text("bio").notNull().default(""),
    avatar: text("avatar").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("AdminUser_username_key").on(t.username), uniqueIndex("AdminUser_slug_key").on(t.slug)]
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

/**
 * Full-text search document for a post: the title counts most, then the
 * excerpt, then the body with its HTML tags removed. Search queries must use
 * this same expression so Postgres can use the index on it.
 */
export const postSearchDocument = (t: { title: AnyPgColumn; excerpt: AnyPgColumn; content: AnyPgColumn }) =>
  sql`(setweight(to_tsvector('english', ${t.title}), 'A') || setweight(to_tsvector('english', ${t.excerpt}), 'B') || setweight(to_tsvector('english', regexp_replace(${t.content}, '<[^>]+>', ' ', 'g')), 'C'))`;

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
    // Guest author name; when set it replaces the writer's own name on the post.
    author: text("author").notNull().default(""),
    // The team member who wrote the post.
    authorId: text("authorId"),
    categoryId: text("categoryId"),
    // Optional overrides for search engines and link previews.
    seoTitle: text("seoTitle").notNull().default(""),
    seoDescription: text("seoDescription").notNull().default(""),
    ogImage: text("ogImage").notNull().default(""),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    publishedAt: timestamp("publishedAt", { precision: 3, mode: "date" }),
    // When the post was emailed to newsletter subscribers; null until sent.
    newsletterSentAt: timestamp("newsletterSentAt", { precision: 3, mode: "date" }),
  },
  (t) => [
    uniqueIndex("Post_slug_key").on(t.slug),
    index("Post_status_publishedAt_idx").on(t.status, t.publishedAt),
    index("Post_authorId_idx").on(t.authorId),
    index("Post_search_idx").using("gin", postSearchDocument(t)),
    foreignKey({ name: "Post_categoryId_fkey", columns: [t.categoryId], foreignColumns: [categories.id] })
      .onDelete("set null")
      .onUpdate("cascade"),
    foreignKey({ name: "Post_authorId_fkey", columns: [t.authorId], foreignColumns: [adminUsers.id] }).onDelete("set null"),
  ]
);

// Daily view counts per post, for the dashboard's readership stats.
export const postViews = pgTable(
  "PostView",
  {
    postId: text("postId").notNull(),
    day: date("day", { mode: "string" }).notNull(),
    views: integer("views").notNull().default(0),
  },
  (t) => [
    primaryKey({ name: "PostView_pkey", columns: [t.postId, t.day] }),
    index("PostView_day_idx").on(t.day),
    foreignKey({ name: "PostView_postId_fkey", columns: [t.postId], foreignColumns: [posts.id] }).onDelete("cascade"),
  ]
);

// Saved versions of a post's title, excerpt and body, so earlier versions can be restored.
export const postRevisions = pgTable(
  "PostRevision",
  {
    id: id(),
    postId: text("postId").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    content: text("content").notNull().default(""),
    // Display name or username of whoever saved this version.
    savedBy: text("savedBy").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [
    index("PostRevision_postId_createdAt_idx").on(t.postId, t.createdAt),
    foreignKey({ name: "PostRevision_postId_fkey", columns: [t.postId], foreignColumns: [posts.id] }).onDelete("cascade"),
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

// Reader comments. New ones wait in the admin's queue ("pending") until approved;
// only "approved" comments are shown on the post. Replies point at their parent.
export const comments = pgTable(
  "Comment",
  {
    id: id(),
    postId: text("postId").notNull(),
    parentId: text("parentId"),
    authorName: text("authorName").notNull(),
    // Optional and never shown publicly; lets the admin reach the commenter.
    authorEmail: text("authorEmail").notNull().default(""),
    content: text("content").notNull(),
    status: text("status").notNull().default("pending"),
    // Written by the signed-in admin (shown with an "Author" badge).
    isAuthor: boolean("isAuthor").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [
    index("Comment_postId_status_createdAt_idx").on(t.postId, t.status, t.createdAt),
    index("Comment_status_createdAt_idx").on(t.status, t.createdAt),
    foreignKey({ name: "Comment_postId_fkey", columns: [t.postId], foreignColumns: [posts.id] }).onDelete("cascade"),
    foreignKey({ name: "Comment_parentId_fkey", columns: [t.parentId], foreignColumns: [t.id] }).onDelete("cascade"),
  ]
);

// Newsletter subscribers. A signup stays "pending" until the address is
// confirmed from the email link; "unsubscribed" rows are kept so the address
// isn't emailed again. The token identifies the subscriber in confirm and
// unsubscribe links.
export const subscribers = pgTable(
  "Subscriber",
  {
    id: id(),
    email: text("email").notNull(),
    status: text("status").notNull().default("pending"),
    token: text("token").notNull(),
    createdAt: createdAt(),
    confirmedAt: timestamp("confirmedAt", { precision: 3, mode: "date" }),
  },
  (t) => [
    uniqueIndex("Subscriber_email_key").on(t.email),
    uniqueIndex("Subscriber_token_key").on(t.token),
    index("Subscriber_status_idx").on(t.status),
  ]
);

// Failed-login counters for rate limiting. Stored in the database so limits
// hold across serverless instances.
export const loginAttempts = pgTable("LoginAttempt", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  resetAt: timestamp("resetAt", { precision: 3, mode: "date" }).notNull(),
});

export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  category: one(categories, { fields: [posts.categoryId], references: [categories.id] }),
  authorUser: one(adminUsers, { fields: [posts.authorId], references: [adminUsers.id] }),
  postTags: many(postTags),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
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
export type Comment = typeof comments.$inferSelect;
export type Subscriber = typeof subscribers.$inferSelect;
export type PostRevision = typeof postRevisions.$inferSelect;
export type PostWithCategory = Post & { category: Category | null };
