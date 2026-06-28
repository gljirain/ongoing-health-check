// Seed the curated, reviewed Layer-1 explainers into whatever DB DATABASE_URL
// points at. Used by `db:seed` (dev.db) and prepare-desktop.js (template.db).
import { PrismaClient } from "@prisma/client";
import { seedExplainers } from "../lib/lab-explainers";

const prisma = new PrismaClient();

seedExplainers(prisma)
  .then((n) => {
    console.log(`Seeded ${n} reviewed lab explainers.`);
    return prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
