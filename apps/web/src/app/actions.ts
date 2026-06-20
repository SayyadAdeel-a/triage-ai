"use server";
import { processEmails, reProcessAllEmails } from "@/lib/ai-processor";
import { reProcessAllLinkedInMessages, processLinkedInMessages } from "@/lib/linkedin-processor";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/vector-search";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ratelimit } from "@/lib/ratelimit";
import { generateTextWithLocalFallback } from "@/lib/llm-client";
import { DEFAULT_EMAIL_CATEGORIES } from "@/lib/constants";

// --- Zod Validation Schemas ---
const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long")
});

const ruleSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  content: z.string().min(1, "Content is required").max(2000, "Content too long")
});

const idSchema = z.string().cuid({ message: "Invalid ID format" });

const bulkKnowledgeSchema = z.object({
  content: z.string().min(1, "Content is required").max(100000, "Payload too large")
});

const reCategorizeSchema = z.object({
  emailId: idSchema,
  newCategory: z.string().min(1).max(50)
});

// --- Security Helpers ---
async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

async function checkRateLimit(userId: string, actionName: string) {
  const { success } = await ratelimit.limit(`rl:${actionName}:${userId}`);
  if (!success) {
    throw new Error("Rate limit exceeded. Please try again later.");
  }
}

export async function syncEmailsAction() {
  try {
    const user = await requireAuth();
    await checkRateLimit(user.id, "syncEmails");
    
    const result = await processEmails(user.id);
    
    await prisma.appConfig.update({
      where: { userId: user.id },
      data: { lastEmailSync: new Date() }
    });
    
    revalidatePath("/");
    return result;
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function syncLinkedInAction() {
  try {
    const user = await requireAuth();
    await checkRateLimit(user.id, "syncLinkedIn");
    
    const result = await processLinkedInMessages(user.id);
    
    await prisma.appConfig.update({
      where: { userId: user.id },
      data: { lastLinkedInSync: new Date() }
    });
    
    revalidatePath("/");
    return result;
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

import { createLinkedInMcpClient } from "@/lib/linkedin-mcp-client";

export async function connectLinkedInAction() {
  try {
    const user = await requireAuth();
    await checkRateLimit(user.id, "connectLinkedIn");
    
    const { client, transport } = await createLinkedInMcpClient();
    
    try {
      await Promise.race([
        client.callTool({ name: "get_my_profile", arguments: {} }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout waiting for login")), 45000))
      ]);
      
      await prisma.appConfig.upsert({
        where: { userId: user.id },
        update: { linkedInConnected: true },
        create: { userId: user.id, linkedInConnected: true }
      });
      revalidatePath("/");
      revalidatePath("/settings");
      return { success: true, verified: true };
    } catch (err: any) {
      if (err.message === "Timeout waiting for login") {
         return { success: true, verified: false, message: "Login window opened. Please complete login in the popup." };
      }
      throw err;
    } finally {
      try {
        await transport.close();
      } catch (e) {
        console.error(e);
      }
    }

  } catch (e: any) {
    console.error("LinkedIn Connect Error:", e);
    return { success: false, message: e.message };
  }
}

export async function verifyLinkedInConnectionAction() {
  try {
    const user = await requireAuth();
    await checkRateLimit(user.id, "verifyLinkedIn");
    
    const { client, transport } = await createLinkedInMcpClient();
    try {
      const result = await client.callTool({ name: "get_my_profile", arguments: {} });
      
      await prisma.appConfig.upsert({
        where: { userId: user.id },
        update: { linkedInConnected: true },
        create: { userId: user.id, linkedInConnected: true }
      });
      
      revalidatePath("/");
      revalidatePath("/settings");
      return { success: true, profile: (result.content as any[])[0]?.text };
    } finally {
      try { await transport.close(); } catch (e) { console.error(e); }
    }
  } catch (e: any) {
    return { success: false, message: "Verification failed. You might need to reconnect." };
  }
}

export async function disconnectLinkedInAction() {
  try {
    const user = await requireAuth();
    await checkRateLimit(user.id, "disconnectLinkedIn");
    
    await prisma.appConfig.update({
      where: { userId: user.id },
      data: { linkedInConnected: false }
    });
    
    revalidatePath("/");
    revalidatePath("/settings");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function reProcessEmailsAction() {
  try {
    const user = await requireAuth();
    await checkRateLimit(user.id, "reProcessEmails");
    
    const result = await reProcessAllEmails(user.id);
    revalidatePath("/");
    return result;
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function reProcessLinkedInAction() {
  try {
    const user = await requireAuth();
    await checkRateLimit(user.id, "reProcessLinkedIn");
    
    const result = await reProcessAllLinkedInMessages(user.id);
    revalidatePath("/");
    return result;
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function addCategoryAction(name: string) {
  try {
    const user = await requireAuth();
    const validated = categorySchema.parse({ name: name.trim() });
    
    await prisma.category.create({
      data: { name: validated.name, userId: user.id }
    });
    revalidatePath("/");
    return { success: true };
  } catch (e: any) {
    if (e.code === 'P2002') return { success: false, message: "Category already exists" };
    return { success: false, message: e.errors ? e.errors[0].message : e.message };
  }
}

export async function addRuleAction(title: string, content: string) {
  try {
    const user = await requireAuth();
    const validated = ruleSchema.parse({ title: title.trim(), content: content.trim() });
    
    await prisma.rule.create({
      data: { title: validated.title, content: validated.content, userId: user.id }
    });
    revalidatePath("/knowledge");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.errors ? e.errors[0].message : e.message };
  }
}

export async function deleteRuleAction(id: string) {
  try {
    await requireAuth();
    const validId = idSchema.parse(id);
    
    await prisma.rule.delete({ where: { id: validId } });
    revalidatePath("/knowledge");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.errors ? e.errors[0].message : e.message };
  }
}

export async function deleteKnowledgeAction(id: string) {
  try {
    await requireAuth();
    const validId = idSchema.parse(id);
    
    await prisma.knowledge.delete({ where: { id: validId } });
    revalidatePath("/knowledge");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.errors ? e.errors[0].message : e.message };
  }
}

export async function addBulkKnowledgeAction(content: string) {
  try {
    const user = await requireAuth();
    const validated = bulkKnowledgeSchema.parse({ content: content.trim() });
    
    const chunks = validated.content.split(/\n\s*\n/).map(c => c.trim()).filter(c => c.length > 20);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      const embeddingArray = await generateEmbedding(chunkText);
      const firstLine = chunkText.trim().split('\n')[0];
      const cleanTitle = firstLine.split(/\s+/).slice(0, 6).join(" ") + (firstLine.split(/\s+/).length > 6 ? "..." : "");

      await prisma.knowledge.create({
        data: {
          title: cleanTitle,
          content: chunkText,
          userId: user.id,
          embedding: JSON.stringify(embeddingArray)
        }
      });
    }
    
    revalidatePath("/knowledge");
    return { success: true, chunksProcessed: chunks.length };
  } catch (e: any) {
    return { success: false, message: e.errors ? e.errors[0].message : e.message };
  }
}

export async function loadDemoInboxAction() {
  try {
    const user = await requireAuth();
    
    const demoEmails = [
      { providerMessageId: "demo-1", subject: "Invoice #1042 Overdue", senderName: "Acme Corp Billing", senderEmail: "billing@acmecorp.com", category: "Important", priority: 5, replyNeeded: false, summary: "Your invoice for $4,200 is 3 days overdue.", confidenceScore: 98, draftReply: null },
      { providerMessageId: "demo-2", subject: "Critical Bug in Production", senderName: "Sarah Engineer", senderEmail: "sarah@startup.io", category: "Needs Reply", priority: 5, replyNeeded: true, summary: "The payment gateway is failing for 10% of users.", confidenceScore: 99, draftReply: "I'm on it. Looking at the Datadog logs now." },
      { providerMessageId: "demo-3", subject: "Q3 Board Deck Draft", senderName: "Investor John", senderEmail: "john@vc.com", category: "Needs Reply", priority: 4, replyNeeded: true, summary: "Can you send me the Q3 board deck draft by tomorrow?", confidenceScore: 95, draftReply: "Yes, I will send it over by EOD tomorrow." },
      { providerMessageId: "demo-4", subject: "Your Weekly GitHub Digest", senderName: "GitHub", senderEmail: "noreply@github.com", category: "Newsletters", priority: 2, replyNeeded: false, summary: "Weekly digest of activity on your repositories.", confidenceScore: 100, draftReply: null },
      { providerMessageId: "demo-5", subject: "Uber Receipt", senderName: "Uber Receipts", senderEmail: "receipts@uber.com", category: "Notifications", priority: 1, replyNeeded: false, summary: "Receipt for your ride on Tuesday ($14.50).", confidenceScore: 99, draftReply: null },
      { providerMessageId: "demo-6", subject: "Introduction: Jane <> You", senderName: "Mike Advisor", senderEmail: "mike@advisor.net", category: "Needs Reply", priority: 3, replyNeeded: true, summary: "Mike is introducing you to Jane for a potential partnership.", confidenceScore: 92, draftReply: "Hi Jane, great to connect. Let's find time next week." },
      { providerMessageId: "demo-7", subject: "SOC2 Audit Scope Change", senderName: "Compliance Team", senderEmail: "audit@drata.com", category: "Important", priority: 4, replyNeeded: false, summary: "We need to adjust the scope of the upcoming SOC2 audit.", confidenceScore: 88, draftReply: "Understood. Can we jump on a 10min call tomorrow to align?" },
      { providerMessageId: "demo-8", subject: "Save 50% on AWS credits", senderName: "AWS Marketing", senderEmail: "promo@aws.amazon.com", category: "Promotions", priority: 1, replyNeeded: false, summary: "Promotional email for AWS startup credits.", confidenceScore: 97, draftReply: null },
      { providerMessageId: "demo-9", subject: "Urgent: Server memory limit reached", senderName: "Datadog Alerts", senderEmail: "alerts@datadoghq.com", category: "Notifications", priority: 5, replyNeeded: false, summary: "Production server mem-01 is at 99% capacity.", confidenceScore: 96, draftReply: null },
      { providerMessageId: "demo-10", subject: "Interview next steps?", senderName: "Alex Candidate", senderEmail: "alex@gmail.com", category: "Needs Reply", priority: 4, replyNeeded: true, summary: "Alex is following up on his engineering interview from Monday.", confidenceScore: 94, draftReply: "Alex, we'd love to move forward. I'll send an offer letter shortly." },
    ];

    const defaultCats = DEFAULT_EMAIL_CATEGORIES;
    for (const cat of defaultCats) {
      await prisma.category.upsert({
        where: { name_userId: { name: cat, userId: user.id } },
        update: {},
        create: { name: cat, userId: user.id }
      });
    }

    for (const email of demoEmails) {
      await prisma.email.upsert({
        where: { providerMessageId: email.providerMessageId },
        update: { ...email, userId: user.id },
        create: { ...email, userId: user.id }
      });
    }
    revalidatePath("/");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function generateDailyBriefingAction() {
  try {
    const user = await requireAuth();
    await checkRateLimit(user.id, "generateDailyBriefing");
    
    const emails = await prisma.email.findMany({
      orderBy: { time: 'desc' },
      take: 50
    });

    if (emails.length === 0) {
      return { success: false, message: "No emails to summarize." };
    }

    const summaryText = emails.map(e => `[${e.category}] From: ${e.senderName} - Subject: ${e.subject}\nSummary: ${e.summary}`).join("\n\n");

    const { text } = await generateTextWithLocalFallback({
      prompt: `You are an AI assistant for a busy startup founder. Write a "Daily AI Inbox Briefing".
Here are the recent emails categorized in the inbox:

${summaryText}

Write a punchy, highly readable morning briefing (max 4-5 sentences). 
Format:
"Good morning. You have X urgent/important emails, Y that need replies..."
Highlight the top 1 or 2 highest priority items by name/subject.
Do not use markdown headers, just text.`
    });

    return { success: true, briefing: text };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function reCategorizeEmailAction(emailId: string, newCategory: string) {
  try {
    await requireAuth();
    const validated = reCategorizeSchema.parse({ emailId, newCategory });
    
    const email = await prisma.email.update({
      where: { id: validated.emailId },
      data: { category: validated.newCategory }
    });

    const ruleTitle = `Auto-Rule: Sender ${email.senderEmail}`;
    const ruleContent = `Force sender ${email.senderEmail} to be categorized as "${validated.newCategory}". Do NOT put this sender in any other category.`;
    
    const existing = await prisma.rule.findFirst({ where: { title: ruleTitle } });
    if (existing) {
      await prisma.rule.update({ where: { id: existing.id }, data: { content: ruleContent } });
    } else {
      await prisma.rule.create({ data: { title: ruleTitle, content: ruleContent } });
    }

    revalidatePath("/");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.errors ? e.errors[0].message : e.message };
  }
}

export async function updateDraftAction(id: string, newDraft: string, type: "email" | "linkedin") {
  try {
    await requireAuth();
    
    if (type === "email") {
      await prisma.email.update({
        where: { id },
        data: { draftReply: newDraft }
      });
    } else {
      await prisma.linkedInMessage.update({
        where: { id },
        data: { draftReply: newDraft }
      });
    }
    
    revalidatePath("/");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.errors ? e.errors[0].message : e.message };
  }
}

export async function getKnowledgeDataAction() {
  const user = await requireAuth();
  const rulesData = await prisma.rule.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  const knowledgeData = await prisma.knowledge.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return { rulesData, knowledgeData };
}

export async function sendLinkedInMessageAction(id: string, linkedinUsername: string, message: string) {
  try {
    await requireAuth();

    let conn;
    try {
      conn = await createLinkedInMcpClient();
    } catch (e) {
      console.error("Failed to connect to LinkedIn MCP:", e);
      return { success: false, message: "Failed to connect to LinkedIn background service." };
    }

    const mcp = conn.client;
    
    // Send the message
    const sendResponse = await mcp.callTool({
      name: "send_message",
      arguments: {
        linkedin_username: linkedinUsername,
        message: message,
        confirm_send: true
      }
    });

    console.log("MCP send_message response:", JSON.stringify(sendResponse, null, 2));

    conn.transport.close();

    if (sendResponse.isError) {
      const errorText = (sendResponse.content as any[])?.find((c: any) => c.type === 'text')?.text || "Unknown MCP Error";
      return { success: false, message: errorText };
    }

    const responseText = (sendResponse.content as any[])?.find((c: any) => c.type === 'text')?.text || "";
    
    // Try parsing as JSON first
    try {
      const parsed = JSON.parse(responseText);
      if (parsed.sent === false || parsed.status === "message_unavailable") {
        return { success: false, message: parsed.message || "Could not send message to this profile." };
      }
    } catch (err) {
      // Not JSON, fallback to keyword checks
      if (responseText.toLowerCase().includes("error") || responseText.toLowerCase().includes("failed")) {
        return { success: false, message: responseText };
      }
    }

    // Mark as replied/archived
    await prisma.linkedInMessage.update({
      where: { id },
      data: { replyNeeded: false }
    });
    
    revalidatePath("/");
    return { success: true };
  } catch (e: any) {
    console.error("Failed to send LinkedIn message:", e);
    return { success: false, message: e.message || "An error occurred while sending the message." };
  }
}

export async function updateCategoryAction(id: string, newCategory: string, type: "email" | "linkedin") {
  try {
    await requireAuth();
    if (type === "email") {
      await prisma.email.update({ where: { id }, data: { category: newCategory } });
    } else {
      await prisma.linkedInMessage.update({ where: { id }, data: { category: newCategory } });
    }
    revalidatePath("/");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}
