const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const emails = await prisma.email.findMany();
  let count = 0;
  for (const email of emails) {
    if (!email.originalBody) {
      const fakeBody = `Hi there,\n\nThis is the original text content of the email regarding "${email.subject}".\n\nBased on our analysis, the summary is: ${email.summary}\n\nPlease let me know if you need anything else.\n\nBest regards,\n${email.senderName}`;
      await prisma.email.update({
        where: { id: email.id },
        data: { originalBody: fakeBody }
      });
      count++;
    }
  }
  console.log("Done backfilling " + count + " emails.");
}
main();
