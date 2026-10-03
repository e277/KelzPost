// Seeds default settings, the Home and About pages, and categories from seed-data.json. Optional: the
// app's first-run screen (/admin/login) creates the admin account and the same
// defaults. Safe to re-run — existing rows are left alone.
//
// Set ADMIN_USERNAME and ADMIN_PASSWORD to also create an admin account.
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import seedData from "./seed-data.json";

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const sql = postgres(url, { max: 1 });
const db = drizzle(sql, { schema });

async function main() {
  await db.insert(schema.settings).values({ id: 1, ...seedData.settings }).onConflictDoNothing();

  // The built-in Home and About pages (ids "home" and "about").
  await db
    .insert(schema.pages)
    .values([
      { id: "home", kind: "home", slug: "", ...seedData.pages.home },
      { id: "about", kind: "about", slug: "about", ...seedData.pages.about },
    ])
    .onConflictDoNothing();

  if (seedData.categories.length > 0) {
    await db
      .insert(schema.categories)
      .values(seedData.categories.map((name, order) => ({ name, order })))
      .onConflictDoNothing({ target: schema.categories.name });
  }

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (username && password) {
    if (password.length < 8) throw new Error("ADMIN_PASSWORD must be at least 8 characters.");
    const passwordHash = await bcrypt.hash(password, 10);
    await db.insert(schema.adminUsers).values({ username, passwordHash }).onConflictDoNothing({ target: schema.adminUsers.username });
    console.log(`Admin user "${username}" is ready.`);
  } else {
    console.log("No ADMIN_USERNAME/ADMIN_PASSWORD set — create the admin account at /admin/login.");
  }
}

main()
  .then(() => sql.end())
  .catch(async (e) => {
    console.error(e);
    await sql.end();
    process.exit(1);
  });
