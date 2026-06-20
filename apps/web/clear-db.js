const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.linkedInMessage.deleteMany({});
  console.log('Deleted all LinkedIn messages.');
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
