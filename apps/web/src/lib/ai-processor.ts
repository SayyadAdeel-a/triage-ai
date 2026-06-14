import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { prisma } from './prisma';
import { generateEmbedding, cosineSimilarity } from "./vector-search";
import { getMcpClient } from './mcp-client';

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

const models = [
  groq('llama-3.1-8b-instant'),
  google('gemini-1.5-flash'),
  openrouter('meta-llama/llama-3.1-8b-instruct:free'),
  groq('llama-3.3-70b-versatile')
];

async function generateTextWithFallback(options: any) {
  let lastError;
  for (const model of models) {
    try {
      return await generateText({ ...options, model });
    } catch (e) {
      console.warn(`Model failed, falling back to next provider. Error:`, e);
      lastError = e;
    }
  }
  throw lastError;
}

export async function processEmails() {
  console.log("Starting email processing cycle...");
  
  let mcp;
  try {
    mcp = await getMcpClient();
  } catch (error) {
    console.error("Failed to connect to MCP:", error);
    return { success: false, message: "Failed to connect to email server." };
  }
  
  try {
    // 1. Fetch email IDs
    console.log("Fetching unread emails...");
    const listResponse = await mcp.client.callTool({
      name: "list_emails",
      // Pulling up to 50 emails to process in batches
      arguments: { account: "personal", pageSize: 50, seen: false }
    });
    
    const listText = (listResponse.content as any[]).find((c: any) => c.type === 'text')?.text || "";
    if (listText.toLowerCase().includes("error") && !listText.includes("emails")) {
      return { success: false, message: `Server Error: ${listText.substring(0, 50)}...` };
    }

    // Extract IDs like [123] from the text
    const matches = Array.from(listText.matchAll(/\[([^\]]+)\]/g));
    let allIds = matches.map(m => m[1]).filter(id => id !== "INBOX");
    
    if (allIds.length === 0) {
      return { success: true, message: "No unread emails found.", count: 0 };
    }

    // 2. Check DB to avoid reprocessing
    const existing = await prisma.email.findMany({
      where: { providerMessageId: { in: allIds } },
      select: { providerMessageId: true }
    });
    const existingIds = existing.map(e => e.providerMessageId);
    let newIds = allIds.filter(id => !existingIds.includes(id));

    if (newIds.length === 0) {
      return { success: true, message: "No new emails to process.", count: 0 };
    }

    // 3.5 Fetch Categories & Knowledge Base
    let dbCategories = await prisma.category.findMany();
    if (dbCategories.length === 0) {
      const defaults = ["Reply Needed", "Important", "Ignore", "Newsletter", "Receipts", "Sensitive"];
      await prisma.category.createMany({
        data: defaults.map(name => ({ name }))
      });
      dbCategories = await prisma.category.findMany();
    }
    const categoryNames = dbCategories.map(c => c.name).join(", ");

    // Fetch Rules (Static Instructions)
    const dbRules = await prisma.rule.findMany();
    const rulesText = dbRules.map(r => `[Rule: ${r.title}]\n${r.content}`).join("\n\n");
    const globalRulesPrompt = rulesText 
      ? `\n\n--- AI INSTRUCTIONS (MUST OBEY) ---\n${rulesText}\n-----------------------------------\n`
      : "";

    // Fetch all knowledge records and parse embeddings once
    const knowledgeBase = await prisma.knowledge.findMany();
    const parsedKnowledge = knowledgeBase.map(k => ({
      ...k,
      vec: k.embedding ? JSON.parse(k.embedding) : null
    })).filter(k => k.vec !== null);

    console.log(`Found ${newIds.length} new emails. Processing in batches of 5...`);
    
    let processedCount = 0;

    // Process in chunks of 2 to avoid token limits
    for (let i = 0; i < newIds.length; i += 2) {
      const batchIds = newIds.slice(i, i + 2);
      console.log(`Fetching bodies for batch ${i / 2 + 1} (${batchIds.length} emails)...`);
      
      try {
        const bodiesResponse = await mcp.client.callTool({
          name: "get_emails",
          arguments: { account: "personal", ids: batchIds, format: "text", maxLength: 1000 }
        });
        const bodiesText = (bodiesResponse.content as any[]).find((c: any) => c.type === 'text')?.text || "";

        // ----- SECRET REDACTION PIPELINE -----
        let safeBodiesText = bodiesText;
        
        // 1. Redact Password Reset / Auth Links
        safeBodiesText = safeBodiesText.replace(/https?:\/\/[^\s>]+(?:reset|token|verify|otp|magic|auth)[^\s>]+/gi, "[REDACTED_SECURE_LINK]");
        
        // 2. Redact API Keys / Bearer Tokens (High entropy strings length 24+)
        // Specifically look for Bearer or common key prefixes, or just long base64/hex strings
        safeBodiesText = safeBodiesText.replace(/(?:Bearer\s+|api_key[\s=:]+|token[\s=:]+)[A-Za-z0-9_.-]{20,}/gi, "$1[REDACTED_SECRET]");
        
        // 3. Redact OTPs (Verification codes: typically 4-8 digits near "code" or "otp")
        safeBodiesText = safeBodiesText.replace(/(?:code|otp|pin|verification)[\s:=]+(\d{4,8})/gi, (match, p1) => match.replace(p1, "[REDACTED_OTP]"));
        
        // 4. Redact Raw Passwords
        safeBodiesText = safeBodiesText.replace(/(?:password is|pwd:)[\s*]+([^\s]+)/gi, (match, p1) => match.replace(p1, "[REDACTED_PASSWORD]"));

        // ----- DETERMINISTIC FILTERING PIPELINE -----
        const emailBlocks = safeBodiesText.split('━━━ [');
        const processedBlocks = emailBlocks.map(block => {
          if (!block.trim()) return block;
          const lowerBlock = block.toLowerCase();
          const isMarketing = lowerBlock.includes('unsubscribe') || 
                              lowerBlock.includes('view in browser') || 
                              lowerBlock.includes('manage preferences') ||
                              lowerBlock.includes('opt out');
          if (isMarketing) {
            return block.replace(/From:\s+[^\n]+/, (match) => `${match}\nDETERMINISTIC SIGNAL: This email contains a mass-mailing footprint (e.g. 'unsubscribe'). It NEVER 'Needs Reply'. Usually, classify as 'Newsletters' or 'Promotions'. HOWEVER, if it's a Google Security/Account Alert, classify as 'Google Alerts'. If it mentions the user's products (e.g. 'Tenreq'), classify as 'Important'. If it is a transactional receipt/confirmation, classify as 'Notifications'.`);
          }
          return block;
        });
        safeBodiesText = processedBlocks.join('━━━ [');

        // If an email is explicitly a Google Workspace billing or admin alert, it might not have secrets, but we want to ensure AI categorizes it. 
        // We will pass the safe text to AI. If it's extremely sensitive, AI can categorize it as 'Sensitive' and we'll see it.

        console.log(`Running semantic search (RAG) for batch (${batchIds.length} safe emails)...`);
        // Embed the safe batch text
        const batchEmbedding = await generateEmbedding(safeBodiesText);
        
        // Calculate similarity for all rules
        const scoredRules = parsedKnowledge.map(k => ({
          ...k,
          score: cosineSimilarity(batchEmbedding, k.vec)
        })).sort((a, b) => b.score - a.score);

        // Pick Top 3
        const top3 = scoredRules.slice(0, 3);
        const knowledgeText = top3.map(k => `[Rule: ${k.title}]\n${k.content}`).join("\n\n");
        const knowledgePrompt = knowledgeText 
          ? `\n\n--- KNOWLEDGE BASE (TOP RELEVANT) ---\nYou MUST strictly follow these rules and information when drafting replies:\n${knowledgeText}\n----------------------\n`
          : "";

        console.log("Calling Groq to categorize and summarize batch...");

        // 4. Send the safe chunk to AI with fallback
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

You MUST respond ONLY with a raw JSON object matching exactly this structure. Do NOT wrap in markdown formatting blocks (\`\`\`json). Just the raw JSON:
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

        // Parse the JSON manually robustly
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Could not extract JSON from AI response.");
        const cleanText = jsonMatch[0];
        const object = JSON.parse(cleanText);
        // 5. Save to DB
        for (const email of object.emails) {
          const emailId = email.id || email.messageId;
          if (!batchIds.includes(emailId)) continue;
          
          await prisma.email.create({
            data: {
              providerMessageId: emailId,
              subject: email.subject,
              senderName: email.senderName,
              senderEmail: email.senderEmail,
              category: email.category,
              priority: email.priority || 1,
              replyNeeded: email.replyNeeded || false,
              confidenceScore: email.confidenceScore || 0,
              summary: email.summary,
              draftReply: email.draftReply,
            }
          });
          processedCount++;
        }
      } catch (e) {
        console.error(`Failed to process batch ${i / 5 + 1}:`, e);
        // Continue to the next batch even if this one fails
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

export async function reProcessAllEmails() {
  console.log("Starting full re-processing cycle...");
  
  let mcp;
  try {
    mcp = await getMcpClient();
  } catch (error) {
    console.error("Failed to connect to MCP:", error);
    return { success: false, message: "Failed to connect to email server." };
  }
  
  try {
    const existing = await prisma.email.findMany({ select: { providerMessageId: true } });
    const allIds = existing.map(e => e.providerMessageId).filter(id => !id.startsWith('demo-'));

    if (allIds.length === 0) {
      return { success: true, message: "No real emails in DB to re-process.", count: 0 };
    }

    let dbCategories = await prisma.category.findMany();
    const categoryNames = dbCategories.map(c => c.name).join(", ");

    const dbRules = await prisma.rule.findMany();
    const rulesText = dbRules.map(r => `[Rule: ${r.title}]\n${r.content}`).join("\n\n");
    const globalRulesPrompt = rulesText ? `\n\n--- AI INSTRUCTIONS (MUST OBEY) ---\n${rulesText}\n-----------------------------------\n` : "";

    const knowledgeBase = await prisma.knowledge.findMany();
    const parsedKnowledge = knowledgeBase.map(k => ({
      ...k,
      vec: k.embedding ? JSON.parse(k.embedding) : null
    })).filter(k => k.vec !== null);

    console.log(`Found ${allIds.length} existing emails to re-process. Processing in batches of 5...`);
    
    let processedCount = 0;

    // Process in chunks of 2 to avoid token limits
    for (let i = 0; i < allIds.length; i += 2) {
      const batchIds = allIds.slice(i, i + 2);
      console.log(`Fetching bodies for batch ${i / 2 + 1} (${batchIds.length} emails)...`);
      
      try {
        const bodiesResponse = await mcp.client.callTool({
          name: "get_emails",
          arguments: { account: "personal", ids: batchIds, format: "text", maxLength: 1000 }
        });
        const bodiesText = (bodiesResponse.content as any[]).find((c: any) => c.type === 'text')?.text || "";

        let safeBodiesText = bodiesText;
        safeBodiesText = safeBodiesText.replace(/https?:\/\/[^\s>]+(?:reset|token|verify|otp|magic|auth)[^\s>]+/gi, "[REDACTED_SECURE_LINK]");
        safeBodiesText = safeBodiesText.replace(/(?:Bearer\s+|api_key[\s=:]+|token[\s=:]+)[A-Za-z0-9_.-]{20,}/gi, "$1[REDACTED_SECRET]");
        safeBodiesText = safeBodiesText.replace(/(?:code|otp|pin|verification)[\s:=]+(\d{4,8})/gi, (match, p1) => match.replace(p1, "[REDACTED_OTP]"));
        safeBodiesText = safeBodiesText.replace(/(?:password is|pwd:)[\s*]+([^\s]+)/gi, (match, p1) => match.replace(p1, "[REDACTED_PASSWORD]"));

        // ----- DETERMINISTIC FILTERING PIPELINE -----
        const emailBlocksRe = safeBodiesText.split('━━━ [');
        const processedBlocksRe = emailBlocksRe.map(block => {
          if (!block.trim()) return block;
          const lowerBlock = block.toLowerCase();
          const isMarketing = lowerBlock.includes('unsubscribe') || 
                              lowerBlock.includes('view in browser') || 
                              lowerBlock.includes('manage preferences') ||
                              lowerBlock.includes('opt out');
          if (isMarketing) {
            return block.replace(/From:\s+[^\n]+/, (match) => `${match}\nDETERMINISTIC SIGNAL: This email contains a mass-mailing footprint (e.g. 'unsubscribe'). It NEVER 'Needs Reply'. Usually, classify as 'Newsletters' or 'Promotions'. HOWEVER, if it's a Google Security/Account Alert, classify as 'Google Alerts'. If it mentions the user's products (e.g. 'Tenreq'), classify as 'Important'. If it is a transactional receipt/confirmation, classify as 'Notifications'.`);
          }
          return block;
        });
        safeBodiesText = processedBlocksRe.join('━━━ [');
        const batchEmbedding = await generateEmbedding(safeBodiesText);
        
        const scoredRules = parsedKnowledge.map(k => ({
          ...k,
          score: cosineSimilarity(batchEmbedding, k.vec)
        })).sort((a, b) => b.score - a.score);

        const top3 = scoredRules.slice(0, 3);
        const knowledgeText = top3.map(k => `[Rule: ${k.title}]\n${k.content}`).join("\n\n");
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

You MUST respond ONLY with a raw JSON object matching exactly this structure. Do NOT wrap in markdown formatting blocks (\`\`\`json). Just the raw JSON:
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

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Could not extract JSON from AI response.");
        const cleanText = jsonMatch[0];
        const object = JSON.parse(cleanText);

        for (const email of object.emails) {
          const emailId = email.id || email.messageId;
          if (!batchIds.includes(emailId)) continue;
          
          await prisma.email.update({
            where: { providerMessageId: emailId },
            data: {
              subject: email.subject,
              senderName: email.senderName,
              senderEmail: email.senderEmail,
              category: email.category,
              priority: email.priority || 1,
              replyNeeded: email.replyNeeded || false,
              confidenceScore: email.confidenceScore || 0,
              summary: email.summary,
              draftReply: email.draftReply,
            }
          });
          processedCount++;
        }
      } catch (e) {
        console.error(`Failed to process batch ${i / 5 + 1}:`, e);
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
