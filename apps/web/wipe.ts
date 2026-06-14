import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Wiping database...");
  await prisma.email.deleteMany({});
  await prisma.category.deleteMany({});
  console.log("Database wiped.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
