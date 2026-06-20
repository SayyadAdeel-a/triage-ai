import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const records = await prisma.knowledge.findMany();
  console.log(`Checking ${records.length} knowledge records...`);

  let updatedCount = 0;
  for (const record of records) {
    if (record.title.startsWith("Bulk Snippet #")) {
      const firstLine = record.content.trim().split('\n')[0];
      const cleanTitle = firstLine.split(/\s+/).slice(0, 6).join(" ") + (firstLine.split(/\s+/).length > 6 ? "..." : "");
      
      await prisma.knowledge.update({
        where: { id: record.id },
        data: { title: cleanTitle }
      });
      console.log(`Updated: "${record.title}" -> "${cleanTitle}"`);
      updatedCount++;
    }
  }
  console.log(`Finished. Updated ${updatedCount} records.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
