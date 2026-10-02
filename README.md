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
