# Blog

A small, fully admin-driven blog built with **Next.js (App Router, TypeScript)** and
**Prisma + SQLite**. Everything visitors see — site title, tagline, colors, categories,
posts, about page, and social links — is managed from the built-in admin panel. No
content is hardcoded.

## Tech stack

- **Next.js 16** (App Router, TypeScript, `src/` directory)
- **Prisma 5** ORM with **SQLite** (`prisma/dev.db`)
- **bcryptjs** for admin password hashing
- Custom cookie-based session auth (Web Crypto API, works in Edge middleware)
- Plain CSS (`src/app/globals.css`) — no UI framework

## Project structure

```
src/
  app/
    page.tsx              # Home (post list, search & category filter)
    post/[slug]/page.tsx  # Single post page
    about/page.tsx        # About page
    admin/                 # Admin panel (protected by middleware)
      login/page.tsx
      page.tsx             # Dashboard
      posts/new/page.tsx
      posts/[id]/page.tsx  # Post editor
      settings/page.tsx
    api/                   # REST route handlers (auth, posts, categories, settings)
  components/              # Shared UI (site header/footer, post card, admin shell, editor, etc.)
  lib/                      # prisma client, auth helpers, utils
  middleware.ts            # Protects /admin/* (except /admin/login)
prisma/
  schema.prisma            # Settings, Category, Post, AdminUser models
  seed.ts                  # Seeds default settings, categories, admin user
legacy/                     # Archived original static HTML/CSS/JS site (kept for reference)
```

## Prerequisites

- Node.js 18.18+ (Node 20 LTS recommended)
- npm

## First-time setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Create a `.env` file in the project root (if it doesn't already exist):

   ```env
   DATABASE_URL="file:./dev.db"
   SESSION_SECRET="<a long random string>"
   ```

   Generate a secret with:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Create the database and run migrations**

   ```bash
   npx prisma migrate dev
   ```

   This creates `prisma/dev.db` (SQLite) and applies the schema.

4. **Seed default data**

   ```bash
   npm run db:seed
   ```

   This creates:
   - A default `Settings` row (blog title, tagline, theme colors, etc. — all editable later)
   - Default categories (Personal, Insights, Thoughts, Technology, Travel, Books, Projects)
   - A default admin user: **username `admin`, password `admin123`**

   > ⚠️ Log in and change this password immediately via **Admin → Settings → Security**.

## Running the app

### Development

```bash
npm run dev
```

Visit:
- **Public site**: http://localhost:3000
- **Admin panel**: http://localhost:3000/admin/login

### Production build

```bash
npm run build
npm run start
```

### Other scripts

```bash
npm run lint      # Run ESLint
npm run db:seed   # Re-run the seed script (safe to re-run; uses upserts)
```

To inspect/edit the database directly:

```bash
npx prisma studio
```

## CI/CD and GitHub Pages

Two GitHub Actions workflows live in `.github/workflows/`:

- **`ci.yml`** — runs on pull requests and pushes to non-`main` branches: installs
  dependencies, checks migrations apply, lints, type-checks, and runs both a normal
  `next build` and the static-export build that gets deployed.
- **`deploy-pages.yml`** — runs on every push to `main` (or manually via
  *Run workflow*): builds a static export and deploys it to GitHub Pages.

### One-time setup

In the GitHub repo go to **Settings → Pages → Build and deployment** and set
**Source** to **GitHub Actions**. The site is then published at
`https://<user>.github.io/<repo>/`.

### How it works (and its limits)

GitHub Pages only serves static files — there is no Node server or database. So the
deployed site is a **read-only snapshot** of the public blog:

- `scripts/prepare-static-export.mjs` (CI only) removes the admin panel, API routes and
  auth proxy, and pre-renders every published post and custom page.
- Content comes from the committed SQLite database, `prisma/dev.db`.
- The `/admin` panel does **not** exist on GitHub Pages.

Publishing workflow: run the app locally (`npm run dev`), write/edit posts in the admin
panel, then commit `prisma/dev.db` and push to `main` — the site redeploys automatically.

> Note: the committed `dev.db` also contains the admin password hash. That's fine for a
> local-only admin, but make sure you've changed the default password.

To try the static build locally (on a throwaway copy — the prep script deletes files):

```bash
FORCE_STATIC_PREP=true node scripts/prepare-static-export.mjs
STATIC_EXPORT=true npm run build   # output in out/
```

## Using the admin panel

- **Dashboard** (`/admin`) — overview stats, all posts (filter by status), edit/view/delete.
- **New Post / Editor** (`/admin/posts/new`, `/admin/posts/[id]`) — rich-text editor, cover
  image (upload or URL), category, excerpt, author, draft/publish toggle, delete.
- **Settings** (`/admin/settings`) — blog title & tagline, accent/primary colors, author
  profile & avatar, categories (add/remove), social links, About page content, and
  password change.

Only **published** posts are shown on the public site; drafts are visible only in the
admin dashboard.

## Notes

- `legacy/` contains the original static prototype and is kept for reference only —
  it is not part of the running application.
- Images (cover photos, avatars) are stored as data URLs directly in the database;
  there is no separate file upload/storage step.
