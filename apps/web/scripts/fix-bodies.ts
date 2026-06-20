import { PrismaClient } from '@prisma/client';
import { getMcpClient } from '../src/lib/mcp-client';

const prisma = new PrismaClient();

function cleanEmailText(text: string): string {
  let cleaned = text.replace(/https?:\/\/[^\s\)]+/g, (match) => {
    return match.length > 40 ? '[link]' : match;
  });
  // Clean up empty parentheses left behind like " ( [link] )" or "([link])"
  cleaned = cleaned.replace(/\(\s*\[link\]\s*\)/g, '');
  
  // Clean up excessive newlines and mailparser artifacts
  // 1. Replace 3 or more consecutive newlines with exactly 2 newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  // 2. Fix standalone hyphens (bullet points) separated by newlines
  cleaned = cleaned.replace(/\n\s*-\s*\n\s*/g, '\n- ');
  
  return cleaned.trim();
}

async function main() {
  console.log("Starting quick fix to fetch missing email bodies...");
  let mcp;
  try {
    mcp = await getMcpClient();
  } catch (error) {
    console.error("Failed to connect to MCP:", error);
    process.exit(1);
  }

  const existing = await prisma.email.findMany({ select: { providerMessageId: true } });
  const allIds = existing.map(e => e.providerMessageId).filter(id => !id.startsWith('demo-'));

  if (allIds.length === 0) {
    console.log("No real emails found.");
    process.exit(0);
  }

  console.log(`Found ${allIds.length} emails. Fetching their bodies from MCP...`);

  let updatedCount = 0;
  for (let i = 0; i < allIds.length; i += 10) {
    const batchIds = allIds.slice(i, i + 10);
    console.log(`Fetching batch ${i / 10 + 1}...`);
    try {
      const bodiesResponse = await mcp.client.callTool({
        name: "get_emails",
        arguments: { account: "default", ids: batchIds, format: "text", maxLength: 20000 }
      });
      let bodiesText = (bodiesResponse.content as any[]).find((c: any) => c.type === 'text')?.text || "";
      bodiesText = cleanEmailText(bodiesText);

      // Extract original bodies for saving
      const bodyMap = new Map();
      const rawBlocks = bodiesText.split('━━━ [');
      for (const block of rawBlocks) {
        if (!block.trim()) continue;
        const endIdx = block.indexOf(']');
        if (endIdx !== -1) {
          const id = block.substring(0, endIdx);
          const content = block.substring(endIdx + 1).trim();
          bodyMap.set(id, content);
        }
      }

      for (const emailId of batchIds) {
        const originalBody = bodyMap.get(emailId);
        if (originalBody) {
          await prisma.email.update({
            where: { providerMessageId: emailId },
            data: { originalBody }
          });
          updatedCount++;
        }
      }
    } catch (e) {
      console.error(`Failed to fetch batch ${i / 10 + 1}:`, e);
    }
  }

  console.log(`Successfully updated ${updatedCount} emails with their original raw bodies!`);
  mcp.close();
}

main().catch(console.error);
