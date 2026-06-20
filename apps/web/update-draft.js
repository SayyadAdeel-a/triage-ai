import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const msgs = await prisma.linkedInMessage.findMany({
    where: { senderName: { contains: "Syed Syab" } }
  });

  if (msgs.length > 0) {
    for (const m of msgs) {
      await prisma.linkedInMessage.update({
        where: { id: m.id },
        data: { draftReply: "Hey Syed! Thanks for sharing the job posting. Hope you had a great birthday back in December!" }
      });
      console.log(`Updated message for ${m.senderName}`);
    }
  } else {
    console.log("No messages found.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
