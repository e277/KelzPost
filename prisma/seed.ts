import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  "Personal",
  "Insights",
  "Thoughts",
  "Technology",
  "Travel",
  "Books",
  "Projects",
];

async function main() {
  // Settings singleton row (id = 1)
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  // Default categories
  for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
    await prisma.category.upsert({
      where: { name: DEFAULT_CATEGORIES[i] },
      update: {},
      create: { name: DEFAULT_CATEGORIES[i], order: i },
    });
  }

  // Default admin user
  const existing = await prisma.adminUser.findUnique({ where: { username: "admin" } });
  if (!existing) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await prisma.adminUser.create({
      data: { username: "admin", passwordHash },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
