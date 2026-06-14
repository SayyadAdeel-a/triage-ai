"use server";
import { processEmails, reProcessAllEmails } from "@/lib/ai-processor";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/vector-search";
import { generateText } from "ai";
import { createGroq } from '@ai-sdk/groq';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ratelimit } from "@/lib/ratelimit";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

const models = [
  groq('llama-3.1-8b-instant'),
  google('gemini-1.5-flash'),
  openrouter('meta-llama/llama-3.1-8b-instruct:free'),
  groq('llama-3.3-70b-versatile')
];

// --- Zod Validation Schemas ---
const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long")
});

const ruleSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  content: z.string().min(1, "Content is required").max(2000, "Content too long")
});

const idSchema = z.string().cuid({ message: "Invalid ID format" });
const idOrUuidSchema = z.string().min(1); // Some IDs might be provider message IDs

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
  // Use a composite key for ratelimiting per user per action
  const { success } = await ratelimit.limit(`rl:${actionName}:${userId}`);
  if (!success) {
    throw new Error("Rate limit exceeded. Please try again later.");
  }
}

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

export async function syncEmailsAction() {
  try {
    const user = await requireAuth();
    await checkRateLimit(user.id, "syncEmails");
    
    const result = await processEmails();
    revalidatePath("/");
    return result;
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function reProcessEmailsAction() {
  try {
    const user = await requireAuth();
    await checkRateLimit(user.id, "reProcessEmails");
    
    const result = await reProcessAllEmails();
    revalidatePath("/");
    return result;
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function addCategoryAction(name: string) {
  try {
    await requireAuth();
    const validated = categorySchema.parse({ name: name.trim() });
    
    await prisma.category.create({
      data: { name: validated.name }
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
    await requireAuth();
    const validated = ruleSchema.parse({ title: title.trim(), content: content.trim() });
    
    await prisma.rule.create({
      data: { title: validated.title, content: validated.content }
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
    await requireAuth();
    const validated = bulkKnowledgeSchema.parse({ content: content.trim() });
    
    // Split text into paragraphs (chunks)
    const chunks = validated.content.split(/\n\s*\n/).map(c => c.trim()).filter(c => c.length > 20);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      const embeddingArray = await generateEmbedding(chunkText);
      await prisma.knowledge.create({
        data: {
          title: `Bulk Snippet #${Date.now()}-${i}`,
          content: chunkText,
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
    await requireAuth();
    // This action doesn't hit external APIs for LLMs, but we can rate limit it just in case.
    
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

    const defaultCats = ["Needs Reply", "Important", "Newsletters", "Notifications", "Promotions", "Ignore", "Sensitive"];
    for (const cat of defaultCats) {
      await prisma.category.upsert({ where: { name: cat }, update: {}, create: { name: cat } });
    }

    for (const email of demoEmails) {
      await prisma.email.upsert({
        where: { providerMessageId: email.providerMessageId },
        update: email,
        create: email
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
    
    // Fetch recent emails
    const emails = await prisma.email.findMany({
      orderBy: { time: 'desc' },
      take: 50 // process up to the 50 most recent
    });

    if (emails.length === 0) {
      return { success: false, message: "No emails to summarize." };
    }

    // Prepare text for AI
    const summaryText = emails.map(e => `[${e.category}] From: ${e.senderName} - Subject: ${e.subject}\nSummary: ${e.summary}`).join("\n\n");

    const { text } = await generateTextWithFallback({
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

    // Auto-learning: create a rule for this sender
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
