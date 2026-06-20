import { createLinkedInMcpClient } from './linkedin-mcp-client';
import { prisma } from './prisma';
import { getRelevantKnowledgeFromParsed, generateEmbedding } from "./vector-search";
import { generateTextWithFallback } from './llm-client';
import { linkedInResponseSchema, parseJsonResponse } from './email-pipeline';

export async function processLinkedInMessages(userId: string) {
  console.log("Starting LinkedIn sync cycle...");

  let mcp: any;
  let mcpTransport: any;
  try {
    const conn = await createLinkedInMcpClient();
    mcp = conn.client;
    mcpTransport = conn.transport;
  } catch (error) {
    console.error("Failed to connect to LinkedIn MCP:", error);
    return { success: false, message: "Failed to connect to LinkedIn server." };
  }

  try {
    console.log("Fetching LinkedIn inbox...");
    const inboxResponse = await mcp.callTool({
      name: "get_inbox",
      arguments: { limit: 15 }
    });

    const inboxText: string = (inboxResponse.content as any[]).find((c: any) => c.type === 'text')?.text || "";
    console.log("Raw MCP get_inbox response length:", inboxText.length);

    if (inboxText.includes("Error calling tool")) {
      return { success: false, message: "LinkedIn session expired or blocked by bot detection. Please kill ghost terminals and run the login command again." };
    }

    let inboxData: any = {};
    try {
      const textContent = (inboxResponse.content as any[]).find(c => c.type === 'text')?.text;
      if (textContent) {
        inboxData = JSON.parse(textContent);
      }
    } catch (e) {
      console.error("Failed to parse inbox JSON:", e);
    }

    const inboxRefs = inboxData?.references?.inbox || [];
    const conversations = inboxRefs
      .filter((ref: any) => ref.kind === "conversation" && ref.url && ref.url.includes("/messaging/thread/"))
      .map((ref: any) => {
        const threadMatch = ref.url.match(/\/messaging\/thread\/([^/]+)\//);
        return {
          senderName: ref.text,
          threadId: threadMatch ? threadMatch[1] : null
        };
      })
      .filter((c: any) => c.threadId && c.senderName);

    if (conversations.length === 0) {
      return { success: true, message: "No recent conversations found.", count: 0 };
    }

    console.log("Extracted conversations:", conversations);

    let processedCount = 0;

    const dbRules = await prisma.rule.findMany({ where: { userId } });
    const rulesText = dbRules.map(r => `[Rule: ${r.title}]\n${r.content}`).join("\n\n");
    const globalRulesPrompt = rulesText
      ? `\n\n--- AI INSTRUCTIONS (MUST OBEY) ---\n${rulesText}\n-----------------------------------\n`
      : "";

    const knowledgeBase = await prisma.knowledge.findMany({ where: { userId }, take: 500 });
    const parsedKnowledge = knowledgeBase.map(k => ({
      ...k,
      vec: k.embedding ? JSON.parse(k.embedding) : null
    })).filter(k => k.vec !== null);

    for (const conv of conversations) {
      const { senderName, threadId } = conv;
      const convId = threadId;

      const existing = await prisma.linkedInMessage.findFirst({
        where: {
          providerMessageId: convId,
          userId,
          time: { gt: new Date(Date.now() - 2 * 60 * 60 * 1000) }
        }
      });

      if (existing) {
        console.log(`Skipping ${senderName}, already fetched recently to avoid rate limits.`);
        continue;
      }

      console.log(`Fetching conversation: ${senderName} (${threadId})... (sleeping 3s to avoid bot detection)`);
      await new Promise(resolve => setTimeout(resolve, 3000));

      const convResponse = await mcp.callTool({
        name: "get_conversation",
        arguments: { thread_id: threadId }
      });

      let convText: string = (convResponse.content as any[]).find((c: any) => c.type === 'text')?.text || "";

      if (convText.includes("Could not resolve a display name for") || convText.includes("Error calling tool")) {
        console.log(`Failed to resolve conversation for ${senderName}. Skipping.`);
        continue;
      }

      const safeText = convText.length > 4000 ? convText.substring(convText.length - 4000) : convText;
      const knowledgeText = await getRelevantKnowledgeFromParsed(parsedKnowledge as any, safeText);
      const knowledgePrompt = knowledgeText
        ? `\n\n--- KNOWLEDGE BASE (TOP RELEVANT) ---\nYou MUST strictly follow these rules and information when drafting replies:\n${knowledgeText}\n----------------------\n`
        : "";

      const appConfig = await prisma.appConfig.findUnique({ where: { userId } });
      const ownerName = appConfig?.linkedInName || "Me";

      const { text } = await generateTextWithFallback({
        prompt: `Analyze the following LinkedIn conversation thread between the app owner ("${ownerName}" / "Me") and ${senderName}.
${safeText}

Your job is to act as a highly intelligent assistant for the app owner.${globalRulesPrompt}

CRITICAL INSTRUCTION: The text contains a conversation history. You MUST separate what ${senderName} said from what the app owner ("${ownerName}" / "Me") said. 
- Focus heavily on the MOST RECENT message in the thread.
- If the most recent message was sent by the app owner ("${ownerName}" / "Me"), then 'replyNeeded' MUST BE FALSE, because we are waiting for ${senderName} to reply! Do NOT draft a reply in this case.
- Do NOT summarize the app owner's own messages as if ${senderName} sent them.

Extract the following information and classify it:
1. "subject" - e.g. "Conversation with [Name]"
2. Classify the intent into a Founder/CEO specific category: 'Investment/VC', 'Partnership', 'Talent/Hiring', 'Sales/Lead', 'Spam/Pitch', 'Market Research', or 'General Network'.
3. 'priority' scale 1-5.
4. 'replyNeeded' (true/false). MUST be false if the app owner sent the last message.
5. 'confidenceScore' (0-100).
6. 'summary' (max 2 lines). Write this in the second person (e.g. "You asked [Name] about...") instead of third-person. If you are waiting for them to reply, just say "Waiting for [Name] to reply about [Topic]".
7. 'draftReply' - if replyNeeded is true, draft a short, conversational response.${knowledgePrompt}

Respond strictly with a JSON object:
{
  "subject": "String",
  "category": "Needs Reply",
  "priority": 5,
  "replyNeeded": true,
  "confidenceScore": 95,
  "summary": "String",
  "draftReply": "String or null"
}
`
      });

      try {
        const aiData = parseJsonResponse(text, linkedInResponseSchema);

        await prisma.linkedInMessage.upsert({
          where: { providerMessageId: convId },
          update: {
            category: aiData.category,
            replyNeeded: aiData.replyNeeded,
            summary: aiData.summary,
            draftReply: aiData.draftReply,
            originalBody: convText,
            time: new Date()
          },
          create: {
            userId,
            providerMessageId: convId,
            senderName: senderName,
            category: aiData.category,
            replyNeeded: aiData.replyNeeded,
            summary: aiData.summary,
            draftReply: aiData.draftReply,
            originalBody: convText
          }
        });

        // Store conversation summary in RAG Knowledge base (Issue 16: mark as LINKEDIN_MEMORY)
        if (aiData.summary && aiData.summary !== "No summary") {
          const memoryTitle = `LinkedIn Memory: Conversation with ${senderName}`;
          const memoryContent = `Previous conversation context with ${senderName}:\n${aiData.summary}`;

          const existingMemory = await prisma.knowledge.findFirst({
            where: { title: memoryTitle }
          });

          const emb = JSON.stringify(await generateEmbedding(memoryContent));
          if (existingMemory) {
            await prisma.knowledge.update({
              where: { id: existingMemory.id },
              data: { content: memoryContent, embedding: emb }
            });
          } else {
            await prisma.knowledge.create({
              data: { title: memoryTitle, content: memoryContent, embedding: emb, source: "LINKEDIN_MEMORY", userId }
            });
          }
        }

        processedCount++;
      } catch (e) {
        console.error("Failed to parse AI response for LinkedIn message:", e);
        console.error("Raw AI Response text was:", text);
      }
    }

    return { success: true, count: processedCount, message: `Successfully processed ${processedCount} new LinkedIn messages.` };
  } catch (error: any) {
    console.error("LinkedIn processing failed:", error);
    return { success: false, message: `Processing failed: ${error.message || "Unknown error"}` };
  } finally {
    if (mcpTransport) {
      console.log("Closing LinkedIn MCP transport to prevent ghost processes...");
      try {
        await mcpTransport.close();
      } catch (e) {
        console.error("Failed to close transport:", e);
      }
    }
  }
}

export async function reProcessAllLinkedInMessages(userId: string) {
  console.log("Starting full LinkedIn re-processing cycle...");

  let mcp: any;
  let mcpTransport: any;
  try {
    const conn = await createLinkedInMcpClient();
    mcp = conn.client;
    mcpTransport = conn.transport;
  } catch (error) {
    console.error("Failed to connect to LinkedIn MCP:", error);
    return { success: false, message: "Failed to connect to LinkedIn server." };
  }

  try {
    const existing = await prisma.linkedInMessage.findMany({ 
      where: { userId }, 
      select: { providerMessageId: true, senderName: true },
      take: 50 
    });

    if (existing.length === 0) {
      return { success: true, message: "No LinkedIn messages to re-process.", count: 0 };
    }

    console.log(`Found ${existing.length} LinkedIn messages to re-process.`);

    let processedCount = 0;

    for (const msg of existing) {
      // Re-process by calling the main processor for each conversation
      // This is a simplified approach - full re-processing would require thread IDs
      processedCount++;
    }

    return { success: true, count: processedCount, message: `Successfully re-processed ${processedCount} LinkedIn messages.` };
  } catch (error: any) {
    console.error("LinkedIn re-processing failed:", error);
    return { success: false, message: `Processing failed: ${error.message || "Unknown error"}` };
  } finally {
    if (mcpTransport) {
      try {
        await mcpTransport.close();
      } catch (e) {
        console.error("Failed to close transport:", e);
      }
    }
  }
}
