# Blog

A fully admin-driven blog built with **Next.js (App Router, TypeScript)** and
**Drizzle ORM + PostgreSQL**, deployed on **Vercel**. Everything visitors see (site title,
tagline, colors, navigation, categories, posts, pages, about page, social links) is
managed from the built-in admin panel. No content is hardcoded.

## Features

**For readers**

- Home page with category filters and "load more"
- Search (`/search`, or the search icon in the header): looks through the title, excerpt
  and full text of every published post, puts the best matches first and highlights the
  matching words (see [Search](#search))
- Post pages with reading time, a reading-progress bar, a table of contents (built from
  the post's H2/H3 headings), an author box, share buttons (X, LinkedIn, Facebook, email,
  copy link, native share), previous/next links and related posts
- Category pages (`/category/your-category`) and tag pages (`/tag/your-tag`)
- Author pages (`/author/their-name`) with each writer's bio, photo and posts. Bylines
  link to them (see [Team and authors](#team-and-authors))
- Rich posts: tables, code blocks with syntax highlighting, and YouTube/Vimeo embeds
- Comments on every post. New comments wait for your approval before they appear (see
  [Comments](#comments))
- Light and dark mode: follows the reader's device setting, with a toggle in the header
  that remembers their choice (the admin panel always stays light)
- Custom pages (`/your-page`) and an About page
- RSS feed (`/feed.xml`), `sitemap.xml`, `robots.txt`, Open Graph/Twitter cards and
  `BlogPosting` structured data
- Share images: posts without their own image get a generated preview card with the
  title, author, date and reading time (`/post/<slug>/og`); the site has one too (`/og`)
- Fast pages: public pages are served from a cache and refresh as soon as you change
  something in the admin (see [Caching](#caching))
- Responsive layout with a mobile menu, a footer that stays at the bottom of short
  pages, and a custom 404 page
- Newsletter signup on the home page and every post, with email confirmation and a
  one-click unsubscribe link in every email

**For the admin**

- First-run setup screen: the first visit to `/admin/login` creates the admin account
- Team: admins add writers under **Admin → Team**. Writers sign in with their own
  account and can only see and edit their own posts (see [Team and authors](#team-and-authors))
- Profiles: everyone sets their public name, bio and photo, and changes their password,
  under **Admin → Your Profile**
- Login protection: a rate limit of 5 failed attempts per 15 minutes per IP, constant-time
  session checks, an optional "keep me signed in", and a redirect back to the page you
  were trying to open
- Dashboard: stats (total, published, drafts, words written) that click through to a
  filtered list and stay current across tabs, search, filter and sort (including
  "Most read"), one-click publish/unpublish, draft previews
- Readership: a dashboard panel with views over the last 30 days, the change from the
  30 days before, and the most-read posts, plus a views column for every post (see
  [Readership stats](#readership-stats))
- Editor ([Tiptap](https://tiptap.dev)): headings, lists, quotes, links, images (drag,
  drop or paste to upload, with alt text), tables, code blocks with a language picker,
  YouTube/Vimeo embeds and dividers. Also an editable URL slug, word count,
  unsaved-changes warning and Ctrl/⌘+S to save
- Autosave and version history: drafts save on their own while you write, a backup in
  the browser covers a closed tab, and every post keeps its last 50 versions to restore
  from (see [Autosave and version history](#autosave-and-version-history))
- Scheduled publishing: set the status to Published with a publish date in the future
  and the post goes live on its own at that time, within a minute (it shows as
  Scheduled until then)
- Tags (up to 10 per post) alongside categories
- Per-post SEO: meta title, meta description and social share image, with a search
  result preview. Left empty, they fall back to the title, excerpt and cover image
- Author: each post is credited to the team member who wrote it (admins can change
  this with **Written by**). A post's own **Guest author** field is for one-off writers
  and overrides the name on that post. See [Team and authors](#team-and-authors) for
  which name a post shows
- Images are resized and compressed in the browser, then stored on Vercel Blob (see
  step 6 of [Deploying to Vercel](#deploying-to-vercel))
- Comments: approve, reply to, mark as spam or delete reader comments (admins only)
- Newsletter: see subscribers, email a published post to them in one click, remove
  readers, export the list as CSV (admins only)
- Pages (admins only): edit the built-in About page (always at `/about`, with the
  author photo, name and bio, edited on the same screen), create custom pages, and set the
  header navigation. A new page gets its header link automatically (untick **Show in
  navigation** to leave it out), and that link follows the page's title and address and
  goes away when the page is deleted. Site Navigation reorders the links and adds others,
  like Home, a category or another site
- Categories & Tags (admins only): add or remove categories, and clean up tags you no
  longer use
- Configurations (admins only, formerly Settings): how the public site looks: title,
  colors, homepage hero and layout, social links and footer. Each person changes their
  own password under **Your Profile**
- Works on phones, tablets and desktops: on smaller screens the admin sidebar becomes a
  hamburger menu like the blog's own header, and the dashboard lists posts as cards

## Tech stack

- **Next.js 16** (App Router, TypeScript, `src/` directory)
- **Drizzle ORM** with **PostgreSQL** via the `postgres` driver (e.g. [Neon](https://neon.tech) via the Vercel Marketplace)
- **Vercel Blob** (`@vercel/blob`) for uploaded images
- **Nodemailer** for newsletter email over SMTP
- **Tiptap** for the post and page editor, **sanitize-html** to clean saved post HTML,
  and **highlight.js** to color code blocks on the server
- **bcryptjs** for password hashing; signed-cookie sessions (Web Crypto)
- Plain CSS (`src/app/globals.css`)

## Deploying to Vercel

1. **Import the repo** at [vercel.com/new](https://vercel.com/new). The Next.js preset
   is detected automatically.
2. **Add a database.** In the project, open **Storage → Create Database → Neon
   (Postgres)** and connect it to the project. This sets `DATABASE_URL` and
   `DATABASE_URL_UNPOOLED` for you.
3. **Add environment variables in Vercel** (not GitHub): in your Vercel project, open
   **Settings → Environment Variables**, add each variable, and tick at least the
   **Production** environment.
   - `SESSION_SECRET`: a long random string. Generate one with
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `SITE_URL` (optional): your public URL if you use a custom domain, e.g.
     `https://blog.example.com`. Otherwise the Vercel production domain is used.
   - Newsletter (optional): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` and
     `SMTP_FROM`. See [Newsletter](#newsletter).

   > GitHub's repository **Settings → Environments** and **Secrets** are only for GitHub
   > Actions; the Vercel site never sees them. The "Production"/"Preview" environments
   > Vercel shows in GitHub are deployment records, not settings.
4. **Deploy.** The build runs `drizzle-kit migrate` (the `vercel-build` script), so
   the database tables are created and upgraded automatically. Vercel only picks up new
   or changed environment variables on the next deployment, so **redeploy after changing them**
   (Deployments → ⋯ on the latest one → **Redeploy**).
5. **Visit `/admin/login`** and create your admin account. If something is off, open
   `/api/health`: it shows whether the deployment can see `SESSION_SECRET` and the
   database URLs, and whether the database is reachable (yes/no only, never values).
6. **Add image storage (recommended).** In the project, open **Storage → Create Database →
   Blob**, and connect it to the project. This sets `BLOB_READ_WRITE_TOKEN`. Then redeploy.
   Uploaded images go to Blob from then on, and the build moves any images already saved
   in the database over to Blob (`npm run images:move`). Until a Blob store is connected,
   uploads still work but are saved inside the database, which makes pages heavier.
   If Vercel asks, pick **public** access for the store, since blog images are public.
   `/api/health` reports `imageStorage`: `connected`, `not set up`, or the error Blob
   returned. If Blob fails, uploads fall back to saving inside the database rather than
   failing.

> Every deployment, previews included, runs migrations against the `DATABASE_URL` it is
> given. If you don't want previews to touch production data, enable Neon's preview
> branching in the integration settings.

## Local development

Prerequisites: Node.js 20+, and a PostgreSQL database. Use a local Postgres, Docker
(`docker run -e POSTGRES_USER=blog -e POSTGRES_PASSWORD=blog -p 5432:5432 postgres:16`),
or a free Neon dev branch.

```bash
npm install
cp .env.example .env        # then fill in DATABASE_URL(s) and SESSION_SECRET
npm run db:migrate          # create the tables
npm run db:seed             # optional: default settings and categories
npm run dev
```

- Public site: http://localhost:3000
- Admin: http://localhost:3000/admin/login (the first visit creates the admin account)

`npm run db:seed` loads settings and categories from `src/db/seed-data.json`. Set
`ADMIN_USERNAME` and `ADMIN_PASSWORD` to create an admin account at the same time.

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run db:generate` | Create a migration in `drizzle/` after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:check` | Check the migration history is consistent |
| `npm run db:seed` | Seed default settings and categories |
| `npm run db:studio` | Browse the database with Drizzle Studio |
| `npm run images:move` | Move images saved in the database over to Vercel Blob (runs on every Vercel build; does nothing without a Blob store) |

## CI

`.github/workflows/ci.yml` runs on pull requests and pushes to `main`. Against a
throwaway Postgres it checks that every schema change has a committed migration,
applies the migrations, seeds the database, and runs lint, typecheck and a production
build. Vercel does the deploying.

## Team and authors

The first account (created at `/admin/login`) is an **admin**. Admins add more people
under **Admin → Team** with a username, a temporary password, the name readers will see,
and a role:

| Role   | Can do |
| ------ | ------ |
| Admin  | Everything: all posts, pages, comments, newsletter, settings and the team |
| Author | Write, publish and delete **their own** posts, and edit their own profile |

Everyone fills in their public name, bio and photo, and changes their password, under
**Admin → Your Profile**. Once a writer has a name, their posts link to their author page
(`/author/their-name`), which lists everything they've published.

Which name a post shows, in order:

1. The post's **Guest author** field, if filled in (for one-off writers without an account)
2. The name of the team member the post is credited to (**Written by**, which admins can
   change)
3. the author name under **Pages → About**, for posts not credited to anyone

You can't remove your own account or the last admin. Removing someone keeps their posts,
which then show the author name under **Pages → About**. On a blog that had a single admin before
teams existed, the upgrade credits every existing post to that admin.

## Readership stats

The dashboard counts how often each published post is read. A view is counted when a
reader stays on a post for a few seconds, at most once per post per browser per day.
Search engines and other bots, and anyone signed in to the admin, aren't counted. Counts
are stored per post per day in your own database, with no outside analytics service; the
reader's browser only remembers which posts it has already counted today. Authors see the
numbers for their own posts.

## Search

`/search?q=...` uses PostgreSQL full-text search over every published post, backed by a
database index so it stays fast as the blog grows. Matches in the title rank above the
excerpt, and the excerpt above the body. It understands English word forms ("writing"
finds "write"), quoted phrases (`"dark mode"`), `or`, and `-word` to exclude a word.
Scheduled posts and drafts never appear.

## Autosave and version history

- **Autosave:** a few seconds after you stop typing, a draft saves itself. Published posts
  never autosave, so half-finished edits don't go live; save them yourself when ready.
- **Backup:** the editor also keeps a copy in your browser. If the tab closes before a
  save, reopening the post in the same browser offers to restore those edits.
- **Version History:** every manual save, and an autosave at most every 10 minutes,
  stores a version of the title, excerpt and body. The **Version History** card in the
  editor lists the last 50, with who saved each one. **Restore** loads a version into the
  editor; nothing changes until you save.

## Caching

The home page, post pages, custom pages, About page, RSS feed and sitemap are served from
Vercel's cache instead of being rebuilt on every visit. Saving, publishing, unpublishing
or deleting posts, and changing pages, categories, comments or settings, refreshes them
straight away. They are also rebuilt at most once a minute so scheduled posts appear on
time. Category, tag, author and search pages are always built fresh.

## Comments

Comments are stored in your own database; there is no outside service to set up.

- Readers leave a name and comment (email optional, never shown). New comments are
  **pending** until you approve them in **Admin → Comments**, where you can also reply,
  mark as spam or delete. Replies written in **Admin → Comments** post under your own
  team name with an "Author" badge, appear straight away, and approve the comment they
  answer. Anything typed into the comment form on the blog itself waits for approval,
  even if you are signed in to admin in the same browser.
- Spam protection: a hidden honeypot field, a minimum time to fill in the form, a limit
  of 5 comments per 10 minutes per IP, and comments with more than two links go straight
  to Spam.

## Newsletter

Subscribers are stored in your own database, and emails go out through any email
provider that offers SMTP, using [Nodemailer](https://nodemailer.com). Nothing else needs
to be hosted. The signup form stays hidden until these Vercel environment variables are
set (then redeploy):

| Variable    | Example                               |
| ----------- | ------------------------------------- |
| `SMTP_HOST` | `smtp-relay.brevo.com`                |
| `SMTP_PORT` | `587` (STARTTLS, default) or `465`    |
| `SMTP_USER` | your SMTP login                       |
| `SMTP_PASS` | your SMTP password or app password    |
| `SMTP_FROM` | `My Blog <newsletter@yourdomain.com>` |

Providers with a free tier include Brevo (300 emails/day), Resend, Mailgun and Amazon
SES; a Gmail account with an [app password](https://myaccount.google.com/apppasswords)
(`smtp.gmail.com`, port 465) also works for small lists. Use a `SMTP_FROM` address on a
domain you have verified with the provider so emails don't land in spam.

How it works:

1. A reader signs up and gets a confirmation email; they're only on the list once they
   click the link.
2. After you publish a post, open **Admin → Newsletter** and press **Send** next to it.
   Each post can be sent once. Every email has an unsubscribe link, and mail apps show
   their own one-click unsubscribe button.
3. **Export CSV** downloads the list if you ever move to another email service.

## Project structure

```
src/
  app/
    page.tsx                  # Home
    post/[slug]/page.tsx      # Post page
    [slug]/page.tsx           # Custom pages
    about/page.tsx            # About page
    category/[slug]/, tag/[slug]/  # Category and tag archives
    author/[slug]/            # Author pages
    search/                   # Search results
    newsletter/               # Newsletter confirm and unsubscribe pages
    og/, post/[slug]/og/      # Generated share images
    feed.xml/route.ts         # RSS feed
    sitemap.ts, robots.ts     # SEO
    admin/                    # Admin panel (protected by src/proxy.ts)
      login/                  # Login and first-run setup
      posts/[id]/preview/     # Draft preview
      pages/, categories/     # Pages and header menu; categories and tags
      comments/, newsletter/  # Comment moderation, newsletter sending
      configurations/         # How the public site looks (/admin/settings redirects here)
      team/, profile/         # Team management, your own profile and password
    api/                      # Route handlers (auth, posts and their revisions, pages,
                              # categories, tags, comments, newsletter, uploads, settings,
                              # users, profile, views, health)
  components/                 # Shared UI (public and admin)
    admin/ui.tsx              # Admin cards, fields, confirm dialog and chips
  db/
    schema.ts                 # Tables, relations and row types
    index.ts                  # Database client (db)
    seed.ts, seed-data.json   # Initial settings and categories
    move-images-to-blob.ts    # npm run images:move
  lib/                        # Auth, current user and roles, team, rate limit, site
                              # settings, posts, search, readership stats, revisions,
                              # page refreshes, HTML sanitizing, code highlighting,
                              # comments, newsletter, mailer, Blob, utils
  proxy.ts                    # Redirects signed-out users away from /admin/*
drizzle/                      # SQL migrations (generated by drizzle-kit)
drizzle.config.ts             # drizzle-kit configuration
```

## Notes

- Images (covers, avatars, inline images) are downscaled in the browser and uploaded to
  Vercel Blob through `/api/uploads`; only their URLs are saved in the database. Without a
  Blob store (or if Blob returns an error) they fall back to data URLs in the database,
  where each save must stay under Vercel's 4.5 MB request limit. Files without a MIME type
  are recognised by their extension, and HEIC photos are converted to WebP or JPEG where
  the browser can read them.
- Post HTML is cleaned when it's saved: only the editor's own formatting, images, tables
  and YouTube/Vimeo embeds are kept, so a writer can't add scripts or other embeds. Custom
  pages and the About page can only be edited by admins and are rendered as written.
- After changing anything that visitors see from an admin API route, call
  `refreshPublicPages()` (`src/lib/revalidate.ts`) so the cached pages update straight
  away. Public queries should filter with `livePosts()` (`src/lib/posts.ts`) so drafts and
  scheduled posts stay hidden.
- Admin pages each own one job (posts on the dashboard, pages and the header menu under
  Pages, categories and tags under Categories, how the public site looks under Configurations, your
  own name and password under Your Profile). Build new admin screens from
  `src/components/admin/ui.tsx` (`AdminCard`, `Field`, `ConfirmDialog`) and call the API
  with `apiSend` from `src/lib/admin-api.ts`, so every page looks and handles errors the
  same way. `AdminShell` loads the blog title itself and lists the menu in one `NAV` array.
