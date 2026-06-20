import { prisma } from './prisma';
import { getRelevantKnowledgeFromParsed } from "./vector-search";
import { getMcpClient } from './mcp-client';
import { generateTextWithFallback } from './llm-client';
import { DEFAULT_EMAIL_CATEGORIES } from './constants';
import {
  emailResponseSchema,
  parseJsonResponse,
  redactSecrets,
  applyDeterministicFilters,
  extractBodyMap,
} from './email-pipeline';

function cleanEmailText(text: string): string {
  let cleaned = text.replace(/https?:\/\/[^\s\)]+/g, (match) => {
    return match.length > 40 ? '[link]' : match;
  });
  cleaned = cleaned.replace(/\(\s*\[link\]\s*\)/g, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/\n\s*-\s*\n\s*/g, '\n- ');
  return cleaned.trim();
}

export async function processEmails(userId: string) {
  console.log("Starting email processing cycle...");

  let mcp;
  try {
    mcp = await getMcpClient(userId);
  } catch (error) {
    console.error("Failed to connect to MCP:", error);
    return { success: false, message: "Failed to connect to email server." };
  }

  try {
    console.log("Fetching unread emails...");
    const listResponse = await mcp.client.callTool({
      name: "list_emails",
      arguments: { account: "default", pageSize: 50, seen: false }
    });

    const listText: string = (listResponse.content as any[]).find((c: any) => c.type === 'text')?.text || "";
    if (listText.toLowerCase().includes("error") && !listText.includes("emails")) {
      return { success: false, message: `Server Error: ${listText.substring(0, 50)}...` };
    }

    const matches = Array.from(listText.matchAll(/\[([^\]]+)\]/g));
    let allIds = Array.from(new Set(matches.map((m: any) => m[1]).filter(id => id !== "INBOX")));

    if (allIds.length === 0) {
      return { success: true, message: "No unread emails found.", count: 0 };
    }

    const existing = await prisma.email.findMany({
      where: { providerMessageId: { in: allIds }, userId },
      select: { providerMessageId: true }
    });
    const existingIds = existing.map(e => e.providerMessageId);
    let newIds = allIds.filter(id => !existingIds.includes(id));

    if (newIds.length === 0) {
      return { success: true, message: "No new emails to process.", count: 0 };
    }

    let dbCategories = await prisma.category.findMany({ where: { userId } });
    if (dbCategories.length === 0) {
      await prisma.category.createMany({
        data: DEFAULT_EMAIL_CATEGORIES.map(name => ({ name, userId }))
      });
      dbCategories = await prisma.category.findMany({ where: { userId } });
    }

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

    console.log(`Found ${newIds.length} new emails. Processing in batches of 3...`);

    let processedCount = 0;

    for (let i = 0; i < newIds.length; i += 3) {
      const batchIds = newIds.slice(i, i + 3);
      console.log(`Fetching bodies for batch ${Math.floor(i / 3) + 1} (${batchIds.length} emails)...`);

      try {
        const bodiesResponse = await mcp.client.callTool({
          name: "get_emails",
          arguments: { account: "default", ids: batchIds, format: "text", maxLength: 3000 }
        });
        let bodiesText: string = (bodiesResponse.content as any[]).find((c: any) => c.type === 'text')?.text || "";
        bodiesText = cleanEmailText(bodiesText);

        const safeBodiesText = applyDeterministicFilters(redactSecrets(bodiesText));

        console.log(`Running semantic search (RAG) for batch (${batchIds.length} safe emails)...`);
        const knowledgeText = await getRelevantKnowledgeFromParsed(parsedKnowledge as any, safeBodiesText);
        const knowledgePrompt = knowledgeText
          ? `\n\n--- KNOWLEDGE BASE (TOP RELEVANT) ---\nYou MUST strictly follow these rules and information when drafting replies:\n${knowledgeText}\n----------------------\n`
          : "";

        console.log("Calling AI to categorize and summarize batch...");

        const { text } = await generateTextWithFallback({
          prompt: `Analyze the following unread emails from a founder's inbox.
The emails are provided in a text dump below. Each email is separated and includes its [ID], Subject, Sender, Date, and Body.

Your job is to act as a highly intelligent email assistant.${globalRulesPrompt}

For each email:
1. Extract its ID (the string inside the brackets like [12345] in the header "━━━ [12345]").
2. Extract the Sender's Name and Email.
3. Classify the email by SENDER INTENT using this STRICT HIERARCHY:
   - Rule 1: 'Needs Reply' → A genuine 1-on-1 communication where you have a real relationship or obligation to reply (e.g. your customer asking for support/pricing, an investor intro, a colleague). 
     *CRITICAL*: If someone asks YOU about YOUR pricing/product, it IS 'Needs Reply'. 
     *CRITICAL*: Marketers and cold-emailers often use "fake 1-on-1" tactics (e.g. "Reply and let me know"). If the email is pitching you a product, a startup listing, or a service, it is 'Promotions'. Emails from generic addresses like 'noreply', 'support@', 'info@' NEVER need a reply.
   - Rule 2: 'Google Alerts' → ANY security alert, sign-in notification, recovery email, or device setup email from Google ('no-reply@accounts.google.com', etc).
   - Rule 3: 'Notifications' → Automated system alerts, receipts, password resets, GitHub/Supabase/Facebook alerts.
   - Rule 4: 'Important' → Highly critical business alerts that demand attention (billing failed, domain expiring) OR Newsletters/Insights specifically mentioning YOUR products (like 'Tenreq').
   - Rule 5: 'Newsletters' → Digests, Substack, blog updates, or any email with an unsubscribe link (unless it specifically mentions your own product).
   - Rule 6: 'Promotions' → Sales pitches, startup listings (e.g. Acquire.com), product feature announcements, free trials, discounts, or cold outreach.
   - Rule 7: 'Ignore' → Everything else (noise, spam).
   (Note: If the email contains highly sensitive PII, passwords, or secrets, you may classify it as 'Sensitive').
4. Determine the 'priority' on a scale of 1 to 5 (5 being highest, 1 being lowest).
5. Determine 'replyNeeded' (true/false) based on whether the human expects a response.
6. Generate a confidenceScore (integer between 0 and 100) indicating how certain you are.
7. Generate a concise summary (max 2 lines).
8. If 'replyNeeded' is true, generate a draft response. The reply MUST be in the style of a busy startup founder: extremely short, direct, and conversational. NO corporate jargon. NO formal greetings. Just answer or acknowledge immediately. Use the KNOWLEDGE BASE provided below to answer any questions accurately. If the knowledge base says to decline something, decline it politely. Otherwise, set draftReply to null.${knowledgePrompt}

You MUST respond ONLY with a raw JSON object matching exactly this structure. 
CRITICAL JSON RULES:
- MUST be valid JSON.
- Escape all double quotes inside strings using \".
- Do NOT use raw newlines inside strings, use \n instead.
- Do NOT wrap in markdown formatting blocks (\`\`\`json). Just the raw JSON:
{
  "emails": [
    {
      "id": "12345",
      "subject": "The exact subject",
      "senderName": "John Doe",
      "senderEmail": "john@example.com",
      "category": "Needs Reply",
      "priority": 5,
      "replyNeeded": true,
      "confidenceScore": 95,
      "summary": "John is asking for a meeting on Tuesday.",
      "draftReply": "Tuesday works perfectly. Let's do 2 PM. Cheers"
    }
  ]
}

Emails to process:
${safeBodiesText}`
        });

        const object = parseJsonResponse(text, emailResponseSchema);

        // Save redacted bodies to DB (Issue 7 fix)
        const safeBodyMap = extractBodyMap(safeBodiesText);

        for (const email of object.emails) {
          const emailId = email.id;
          if (!batchIds.includes(emailId)) continue;

          await prisma.email.upsert({
            where: { providerMessageId: emailId },
            update: {
              subject: email.subject,
              senderName: email.senderName,
              senderEmail: email.senderEmail,
              category: email.category,
              priority: email.priority,
              replyNeeded: email.replyNeeded,
              confidenceScore: email.confidenceScore,
              summary: email.summary,
              draftReply: email.draftReply,
              originalBody: safeBodyMap.get(emailId) || null,
            },
            create: {
              userId,
              providerMessageId: emailId,
              subject: email.subject,
              senderName: email.senderName,
              senderEmail: email.senderEmail,
              category: email.category,
              priority: email.priority,
              replyNeeded: email.replyNeeded,
              confidenceScore: email.confidenceScore,
              summary: email.summary,
              draftReply: email.draftReply,
              originalBody: safeBodyMap.get(emailId) || null,
            }
          });
          processedCount++;
        }
      } catch (e) {
        console.error(`Failed to process batch ${Math.floor(i / 3) + 1}:`, e);
      }
    }

    return { success: true, count: processedCount, message: `Successfully processed ${processedCount} new emails across all batches.` };
  } catch (error: any) {
    console.error("AI processing failed:", error);
    return { success: false, message: `Processing failed: ${error.message || "Unknown error"}` };
  } finally {
    mcp.close();
  }
}

export async function reProcessAllEmails(userId: string) {
  console.log("Starting full re-processing cycle...");

  let mcp;
  try {
    mcp = await getMcpClient(userId);
  } catch (error) {
    console.error("Failed to connect to MCP:", error);
    return { success: false, message: "Failed to connect to email server." };
  }

  try {
    const existing = await prisma.email.findMany({ where: { userId }, select: { providerMessageId: true }, take: 500 });
    const allIds = Array.from(new Set(existing.map(e => e.providerMessageId).filter(id => !id.startsWith('demo-'))));

    if (allIds.length === 0) {
      return { success: true, message: "No real emails in DB to re-process.", count: 0 };
    }

    const dbRules = await prisma.rule.findMany({ where: { userId } });
    const rulesText = dbRules.map(r => `[Rule: ${r.title}]\n${r.content}`).join("\n\n");
    const globalRulesPrompt = rulesText ? `\n\n--- AI INSTRUCTIONS (MUST OBEY) ---\n${rulesText}\n-----------------------------------\n` : "";

    const knowledgeBase = await prisma.knowledge.findMany({ where: { userId }, take: 500 });
    const parsedKnowledge = knowledgeBase.map(k => ({
      ...k,
      vec: k.embedding ? JSON.parse(k.embedding) : null
    })).filter(k => k.vec !== null);

    console.log(`Found ${allIds.length} existing emails to re-process. Processing in batches of 3...`);

    let processedCount = 0;

    for (let i = 0; i < allIds.length; i += 3) {
      const batchIds = allIds.slice(i, i + 3);
      console.log(`Fetching bodies for batch ${Math.floor(i / 3) + 1} (${batchIds.length} emails)...`);

      try {
        const bodiesResponse = await mcp.client.callTool({
          name: "get_emails",
          arguments: { account: "default", ids: batchIds, format: "text", maxLength: 3000 }
        });
        let bodiesText: string = (bodiesResponse.content as any[]).find((c: any) => c.type === 'text')?.text || "";
        bodiesText = cleanEmailText(bodiesText);

        const safeBodiesText = applyDeterministicFilters(redactSecrets(bodiesText));

        const knowledgeText = await getRelevantKnowledgeFromParsed(parsedKnowledge as any, safeBodiesText);
        const knowledgePrompt = knowledgeText ? `\n\n--- KNOWLEDGE BASE (TOP RELEVANT) ---\nYou MUST strictly follow these rules and information when drafting replies:\n${knowledgeText}\n----------------------\n` : "";

        console.log("Calling AI to categorize and summarize batch...");

        const { text } = await generateTextWithFallback({
          prompt: `Analyze the following unread emails from a founder's inbox.
The emails are provided in a text dump below. Each email is separated and includes its [ID], Subject, Sender, Date, and Body.

Your job is to act as a highly intelligent email assistant.${globalRulesPrompt}

For each email:
1. Extract its ID (the string inside the brackets like [12345] in the header "━━━ [12345]").
2. Extract the Sender's Name and Email.
3. Classify the email by SENDER INTENT using this STRICT HIERARCHY:
   - Rule 1: 'Needs Reply' → A genuine 1-on-1 communication where you have a real relationship or obligation to reply (e.g. your customer asking for support/pricing, an investor intro, a colleague). 
     *CRITICAL*: If someone asks YOU about YOUR pricing/product, it IS 'Needs Reply'. 
     *CRITICAL*: Marketers and cold-emailers often use "fake 1-on-1" tactics (e.g. "Reply and let me know"). If the email is pitching you a product, a startup listing, or a service, it is 'Promotions'. Emails from generic addresses like 'noreply', 'support@', 'info@' NEVER need a reply.
   - Rule 2: 'Google Alerts' → ANY security alert, sign-in notification, recovery email, or device setup email from Google ('no-reply@accounts.google.com', etc).
   - Rule 3: 'Notifications' → Automated system alerts, receipts, password resets, GitHub/Supabase/Facebook alerts.
   - Rule 4: 'Important' → Highly critical business alerts that demand attention (billing failed, domain expiring) OR Newsletters/Insights specifically mentioning YOUR products (like 'Tenreq').
   - Rule 5: 'Newsletters' → Digests, Substack, blog updates, or any email with an unsubscribe link (unless it specifically mentions your own product).
   - Rule 6: 'Promotions' → Sales pitches, startup listings (e.g. Acquire.com), product feature announcements, free trials, discounts, or cold outreach.
   - Rule 7: 'Ignore' → Everything else (noise, spam).
   (Note: If the email contains highly sensitive PII, passwords, or secrets, you may classify it as 'Sensitive').
4. Determine the 'priority' on a scale of 1 to 5 (5 being highest, 1 being lowest).
5. Determine 'replyNeeded' (true/false) based on whether the human expects a response.
6. Generate a confidenceScore (integer between 0 and 100) indicating how certain you are.
7. Generate a concise summary (max 2 lines).
8. If 'replyNeeded' is true, generate a draft response. The reply MUST be in the style of a busy startup founder: extremely short, direct, and conversational. NO corporate jargon. NO formal greetings. Just answer or acknowledge immediately. Use the KNOWLEDGE BASE provided below to answer any questions accurately. If the knowledge base says to decline something, decline it politely. Otherwise, set draftReply to null.${knowledgePrompt}

You MUST respond ONLY with a raw JSON object matching exactly this structure. 
CRITICAL JSON RULES:
- MUST be valid JSON.
- Escape all double quotes inside strings using \".
- Do NOT use raw newlines inside strings, use \n instead.
- Do NOT wrap in markdown formatting blocks (\`\`\`json). Just the raw JSON:
{
  "emails": [
    {
      "id": "12345",
      "subject": "The exact subject",
      "senderName": "John Doe",
      "senderEmail": "john@example.com",
      "category": "Needs Reply",
      "priority": 5,
      "replyNeeded": true,
      "confidenceScore": 95,
      "summary": "John is asking for a meeting on Tuesday.",
      "draftReply": "Tuesday works perfectly. Let's do 2 PM. Cheers"
    }
  ]
}

Emails to process:
${safeBodiesText}`
        });

        const object = parseJsonResponse(text, emailResponseSchema);
        const safeBodyMap = extractBodyMap(safeBodiesText);

        for (const email of object.emails) {
          const emailId = email.id;
          if (!batchIds.includes(emailId)) continue;

          await prisma.email.upsert({
            where: { providerMessageId: emailId },
            update: {
              subject: email.subject,
              senderName: email.senderName,
              senderEmail: email.senderEmail,
              category: email.category,
              priority: email.priority,
              replyNeeded: email.replyNeeded,
              confidenceScore: email.confidenceScore,
              summary: email.summary,
              draftReply: email.draftReply,
              originalBody: safeBodyMap.get(emailId) || null,
            },
            create: {
              userId,
              providerMessageId: emailId,
              subject: email.subject,
              senderName: email.senderName,
              senderEmail: email.senderEmail,
              category: email.category,
              priority: email.priority,
              replyNeeded: email.replyNeeded,
              confidenceScore: email.confidenceScore,
              summary: email.summary,
              draftReply: email.draftReply,
              originalBody: safeBodyMap.get(emailId) || null,
            }
          });
          processedCount++;
        }
      } catch (e) {
        console.error(`Failed to process batch ${Math.floor(i / 3) + 1}:`, e);
      }
    }

    return { success: true, count: processedCount, message: `Successfully re-processed ${processedCount} emails.` };
  } catch (error: any) {
    console.error("AI processing failed:", error);
    return { success: false, message: `Processing failed: ${error.message || "Unknown error"}` };
  } finally {
    mcp.close();
  }
}
