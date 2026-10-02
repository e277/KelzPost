# Blog

A fully admin-driven blog built with **Next.js (App Router, TypeScript)** and
**Prisma + PostgreSQL**, deployed on **Vercel**. Everything visitors see (site title,
tagline, colors, navigation, categories, posts, pages, about page, social links) is
managed from the built-in admin panel. No content is hardcoded.

## Features

**For readers**

- Home page with search (titles, excerpts and full text), category filters and "load more"
- Post pages with reading time, a reading-progress bar, share buttons (X, LinkedIn,
  Facebook, email, copy link, native share), previous/next links and related posts
- Custom pages (`/your-page`) and an About page
- RSS feed (`/feed.xml`), `sitemap.xml`, `robots.txt`, Open Graph/Twitter cards and
  `BlogPosting` structured data
- Responsive layout with a mobile menu, plus a custom 404 page

**For the admin**

- First-run setup screen: the first visit to `/admin/login` creates the admin account
- Login protection: a rate limit of 5 failed attempts per 15 minutes per IP, constant-time
  session checks, an optional "keep me signed in", and a redirect back to the page you
  were trying to open
- Dashboard: stats, search, filter and sort, one-click publish/unpublish, draft previews
- Editor: rich text (headings, lists, quotes, links, images, code blocks, dividers),
  editable URL slug, word count, unsaved-changes warning, Ctrl/⌘+S to save
- Images are resized and compressed in the browser before upload
- Settings: branding, colors, navigation, hero, layout, author, categories, social
  links, footer, About content, password change
- Works on mobile

## Tech stack

- **Next.js 16** (App Router, TypeScript, `src/` directory)
- **Prisma 5** with **PostgreSQL** (e.g. [Neon](https://neon.tech) via the Vercel Marketplace)
- **bcryptjs** for password hashing; signed-cookie sessions (Web Crypto)
- Plain CSS (`src/app/globals.css`)

## Deploying to Vercel

1. **Import the repo** at [vercel.com/new](https://vercel.com/new). The Next.js preset
   is detected automatically.
2. **Add a database.** In the project, open **Storage → Create Database → Neon
   (Postgres)** and connect it to the project. This sets `DATABASE_URL` and
   `DATABASE_URL_UNPOOLED` for you.
3. **Add environment variables** under **Settings → Environment Variables**:
   - `SESSION_SECRET`: a long random string. Generate one with
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `SITE_URL` (optional): your public URL if you use a custom domain, e.g.
     `https://blog.example.com`. Otherwise the Vercel production domain is used.
4. **Deploy.** The build runs `prisma migrate deploy` (the `vercel-build` script), so
   the database tables are created automatically.
5. **Visit `/admin/login`** and create your admin account.

> Every deployment, previews included, runs migrations against the `DATABASE_URL` it is
> given. If you don't want previews to touch production data, enable Neon's preview
> branching in the integration settings.

## Local development

Prerequisites: Node.js 20+, and a PostgreSQL database. Use a local Postgres, Docker
(`docker run -e POSTGRES_USER=blog -e POSTGRES_PASSWORD=blog -p 5432:5432 postgres:16`),
or a free Neon dev branch.

```bash
npm install                 # also generates the Prisma client
cp .env.example .env        # then fill in DATABASE_URL(s) and SESSION_SECRET
npm run db:deploy           # create the tables
npm run db:seed             # optional: default settings and categories
npm run dev
```

- Public site: http://localhost:3000
- Admin: http://localhost:3000/admin/login (the first visit creates the admin account)

`npm run db:seed` loads settings and categories from `prisma/seed-data.json`. Set
`ADMIN_USERNAME` and `ADMIN_PASSWORD` to create an admin account at the same time.

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run db:migrate` | Create a new migration after editing `prisma/schema.prisma` |
| `npm run db:deploy` | Apply migrations |
| `npm run db:seed` | Seed default settings and categories |
| `npm run db:studio` | Browse the database with Prisma Studio |

## CI

`.github/workflows/ci.yml` runs on pull requests and pushes to `main`. Against a
throwaway Postgres it checks that the migrations match the schema, applies them, seeds
the database, and runs lint, typecheck and a production build. Vercel does the
deploying.

## Project structure

```
src/
  app/
    page.tsx                  # Home
    post/[slug]/page.tsx      # Post page
    [slug]/page.tsx           # Custom pages
    about/page.tsx            # About page
    feed.xml/route.ts         # RSS feed
    sitemap.ts, robots.ts     # SEO
    admin/                    # Admin panel (protected by src/proxy.ts)
      login/                  # Login and first-run setup
      posts/[id]/preview/     # Draft preview
    api/                      # Route handlers (auth, posts, pages, categories, settings)
  components/                 # Shared UI (public and admin)
  lib/                        # Prisma client, auth, rate limit, site settings, utils
  proxy.ts                    # Redirects signed-out users away from /admin/*
prisma/
  schema.prisma               # Data model
  migrations/                 # SQL migrations
  seed.ts, seed-data.json     # Initial settings and categories
```

## Notes

- Images (covers, avatars, inline images) are stored as data URLs in the database. Each
  save must stay under Vercel's 4.5 MB request limit, which is why photos are
  downscaled before upload. For image-heavy posts, use image URLs.
- Post and page HTML comes from the admin editor and is rendered as-is. Only trusted
  people should have admin access.
