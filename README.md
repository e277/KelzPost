# Blog

A fully admin-driven blog built with **Next.js (App Router, TypeScript)** and
**Drizzle ORM + PostgreSQL**, deployed on **Vercel**. Everything visitors see (site title,
tagline, colors, navigation, categories, posts, pages, about page, social links) is
managed from the built-in admin panel. No content is hardcoded.

## Features

**For readers**

- Home page with search (titles, excerpts and full text), category filters and "load more"
- Post pages with reading time, a reading-progress bar, a table of contents (built from
  the post's H2/H3 headings), an author box, share buttons (X, LinkedIn, Facebook, email,
  copy link, native share), previous/next links and related posts
- Category pages (`/category/your-category`) and tag pages (`/tag/your-tag`)
- Comments on every post. New comments wait for your approval before they appear (see
  [Comments](#comments))
- Light and dark mode: follows the reader's device setting, with a toggle in the header
  that remembers their choice (the admin panel always stays light)
- Custom pages (`/your-page`) and an About page
- RSS feed (`/feed.xml`), `sitemap.xml`, `robots.txt`, Open Graph/Twitter cards and
  `BlogPosting` structured data
- Share images: posts without their own image get a generated preview card with the
  title, author, date and reading time (`/post/<slug>/og`); the site has one too (`/og`)
- Responsive layout with a mobile menu, a footer that stays at the bottom of short
  pages, and a custom 404 page
- Newsletter signup on the home page and every post, with email confirmation and a
  one-click unsubscribe link in every email

**For the admin**

- First-run setup screen: the first visit to `/admin/login` creates the admin account
- Login protection: a rate limit of 5 failed attempts per 15 minutes per IP, constant-time
  session checks, an optional "keep me signed in", and a redirect back to the page you
  were trying to open
- Dashboard: stats (total, published, drafts, words written) that click through to a
  filtered list and stay current across tabs, search, filter and sort, one-click
  publish/unpublish, draft previews
- Editor: rich text (headings, lists, quotes, links, images, code blocks, dividers),
  editable URL slug, word count, unsaved-changes warning, Ctrl/⌘+S to save
- Scheduled publishing: set the status to Published with a publish date in the future
  and the post goes live on its own at that time (it shows as Scheduled until then)
- Tags (up to 10 per post) alongside categories
- Per-post SEO: meta title, meta description and social share image, with a search
  result preview. Left empty, they fall back to the title, excerpt and cover image
- Author: posts show **Settings → Author Name**, bio and avatar. A post's own **Author**
  field is only for guest writers and overrides the name on that post
- Images are resized and compressed in the browser, then stored on Vercel Blob (see
  step 6 of [Deploying to Vercel](#deploying-to-vercel))
- Comments: approve, reply to, mark as spam or delete reader comments
- Newsletter: see subscribers, email a published post to them in one click, remove
  readers, export the list as CSV
- Settings: branding, colors, navigation, hero, layout, author, categories, social
  links, footer, About content, password change
- Works on mobile

## Tech stack

- **Next.js 16** (App Router, TypeScript, `src/` directory)
- **Drizzle ORM** with **PostgreSQL** via the `postgres` driver (e.g. [Neon](https://neon.tech) via the Vercel Marketplace)
- **Vercel Blob** (`@vercel/blob`) for uploaded images
- **Nodemailer** for newsletter email over SMTP
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
   the database tables are created automatically. Vercel only picks up new or changed
   environment variables on the next deployment, so **redeploy after changing them**
   (Deployments → ⋯ on the latest one → **Redeploy**).
5. **Visit `/admin/login`** and create your admin account. If something is off, open
   `/api/health`: it shows whether the deployment can see `SESSION_SECRET` and the
   database URLs, and whether the database is reachable (yes/no only, never values).
6. **Add image storage (recommended).** In the project, open **Storage → Create Database →
   Blob**, and connect it to the project. This sets `BLOB_READ_WRITE_TOKEN`. Then redeploy.
   Uploaded images go to Blob from then on, and the build moves any images already saved
   in the database over to Blob (`npm run images:move`). Until a Blob store is connected,
   uploads still work but are saved inside the database, which makes pages heavier.

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

## Comments

Comments are stored in your own database; there is no outside service to set up.

- Readers leave a name and comment (email optional, never shown). New comments are
  **pending** until you approve them in **Admin → Comments**, where you can also reply,
  mark as spam or delete. Your replies post as Settings → Author Name with an "Author"
  badge, appear straight away, and approve the comment you replied to.
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
    newsletter/               # Newsletter confirm and unsubscribe pages
    og/, post/[slug]/og/      # Generated share images
    feed.xml/route.ts         # RSS feed
    sitemap.ts, robots.ts     # SEO
    admin/                    # Admin panel (protected by src/proxy.ts)
      login/                  # Login and first-run setup
      posts/[id]/preview/     # Draft preview
      comments/, newsletter/  # Comment moderation, newsletter sending
    api/                      # Route handlers (auth, posts, pages, categories, tags,
                              # comments, newsletter, uploads, settings, health)
  components/                 # Shared UI (public and admin)
  db/
    schema.ts                 # Tables, relations and row types
    index.ts                  # Database client (db)
    seed.ts, seed-data.json   # Initial settings and categories
    move-images-to-blob.ts    # npm run images:move
  lib/                        # Auth, rate limit, site settings, posts, comments,
                              # newsletter, mailer, Blob, utils
  proxy.ts                    # Redirects signed-out users away from /admin/*
drizzle/                      # SQL migrations (generated by drizzle-kit)
drizzle.config.ts             # drizzle-kit configuration
```

## Notes

- Images (covers, avatars, inline images) are downscaled in the browser and uploaded to
  Vercel Blob through `/api/uploads`; only their URLs are saved in the database. Without a
  Blob store they fall back to data URLs in the database, where each save must stay under
  Vercel's 4.5 MB request limit.
- Post and page HTML comes from the admin editor and is rendered as-is. Only trusted
  people should have admin access.
