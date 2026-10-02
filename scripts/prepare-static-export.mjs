// Prepares the app for a static export (GitHub Pages).
//
// GitHub Pages only serves static files, so the admin panel, API routes and
// auth proxy can't run there. This script runs in CI on a throwaway checkout
// and rewrites the source tree so `next build` can export the public site:
//   - removes src/app/admin, src/app/api and src/middleware.ts
//   - drops `dynamic = "force-dynamic"` so pages render at build time
//   - adds generateStaticParams() to dynamic routes, using the content in the
//     committed SQLite database (prisma/dev.db)
//
// DO NOT run this locally on a working copy you care about — it deletes files.
import { existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

if (!process.env.CI && process.env.FORCE_STATIC_PREP !== "true") {
  console.error("Refusing to run outside CI (set FORCE_STATIC_PREP=true to override).");
  process.exit(1);
}

const app = "src/app";

for (const p of [join(app, "admin"), join(app, "api"), "src/middleware.ts", "src/proxy.ts"]) {
  if (existsSync(p)) {
    rmSync(p, { recursive: true, force: true });
    console.log(`removed ${p}`);
  }
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

for (const file of walk(app).filter((f) => /\.(t|j)sx?$/.test(f))) {
  const src = readFileSync(file, "utf8");
  const out = src.replace(/^export const dynamic = ["']force-dynamic["'];?\s*$/m, "");
  if (out !== src) {
    writeFileSync(file, out);
    console.log(`made static: ${file}`);
  }
}

const prisma = new PrismaClient();
const [posts, pages] = await Promise.all([
  prisma.post.findMany({ where: { status: "published" }, select: { slug: true } }),
  prisma.page.findMany({ select: { slug: true } }),
]);
await prisma.$disconnect();

// Static export fails on dynamic routes with no params, so drop empty ones.
const routes = [
  { file: join(app, "post/[slug]/page.tsx"), slugs: posts.map((p) => p.slug) },
  { file: join(app, "[slug]/page.tsx"), slugs: pages.map((p) => p.slug) },
];

for (const { file, slugs } of routes) {
  if (!existsSync(file)) continue;
  if (slugs.length === 0) {
    rmSync(join(file, ".."), { recursive: true, force: true });
    console.log(`removed ${file} (no content)`);
    continue;
  }
  const params = JSON.stringify(slugs.map((slug) => ({ slug })));
  writeFileSync(
    file,
    readFileSync(file, "utf8") +
      `\nexport const dynamicParams = false;\nexport function generateStaticParams() {\n  return ${params};\n}\n`,
  );
  console.log(`${file}: ${slugs.length} static page(s)`);
}
