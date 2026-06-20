import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.linkedInMessage.updateMany({
    where: { senderName: { contains: "Syed Syab" } },
    data: { replyNeeded: true }
  });
  console.log("Reset message status.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
