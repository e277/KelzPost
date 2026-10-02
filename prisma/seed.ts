import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import seedData from "./seed-data.json";

// Optional: the app's first-run screen (/admin/login) can create the admin
// account and default content instead. Re-running is safe (uses upserts).
//
// Set ADMIN_USERNAME and ADMIN_PASSWORD to also create an admin account.

const prisma = new PrismaClient();

async function main() {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, ...seedData.settings },
  });

  for (const [order, name] of seedData.categories.entries()) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name, order } });
  }

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (username && password) {
    if (password.length < 8) throw new Error("ADMIN_PASSWORD must be at least 8 characters.");
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.adminUser.upsert({ where: { username }, update: {}, create: { username, passwordHash } });
    console.log(`Admin user "${username}" is ready.`);
  } else {
    console.log("No ADMIN_USERNAME/ADMIN_PASSWORD set — create the admin account at /admin/login.");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
