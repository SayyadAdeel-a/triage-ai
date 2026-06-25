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
import { getMcpClient } from "@/lib/mcp-client";

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

export async function sendEmailReplyAction(emailId: string, draftReply: string) {
  try {
    const user = await requireAuth();
    
    const email = await prisma.email.findUnique({
      where: { id: emailId, userId: user.id }
    });
    
    if (!email) throw new Error("Email not found");
    if (!email.providerMessageId) throw new Error("Email provider ID missing");
    
    const { client, close } = await getMcpClient(user.id);
    
    try {
      const response = await client.callTool({
        name: "reply_email",
        arguments: {
          account: "default",
          messageId: email.providerMessageId,
          body: draftReply
        }
      });
      
      const responseText = (response.content as any[])?.find((c: any) => c.type === 'text')?.text || "";
      if (responseText.toLowerCase().includes("error") || responseText.toLowerCase().includes("failed")) {
         return { success: false, message: responseText };
      }

      await prisma.email.update({
        where: { id: emailId },
        data: { replyNeeded: false }
      });
      
      revalidatePath("/");
      return { success: true };
    } finally {
      close();
    }
  } catch (e: any) {
    console.error("Failed to send email reply:", e);
    return { success: false, message: e.message || "Failed to send email" };
  }
}

export async function saveDraftToGmailAction(emailId: string, draftReply: string) {
  try {
    const user = await requireAuth();
    
    const email = await prisma.email.findUnique({
      where: { id: emailId, userId: user.id }
    });
    
    if (!email) throw new Error("Email not found");
    if (!email.providerMessageId) throw new Error("Email provider ID missing");
    
    const { client, close } = await getMcpClient(user.id);
    
    try {
      const response = await client.callTool({
        name: "save_draft",
        arguments: {
          account: "default",
          inReplyTo: email.providerMessageId,
          body: draftReply,
          to: [email.senderEmail],
          subject: email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`
        }
      });
      
      const responseText = (response.content as any[])?.find((c: any) => c.type === 'text')?.text || "";
      if (responseText.toLowerCase().includes("error") || responseText.toLowerCase().includes("failed")) {
         return { success: false, message: responseText };
      }

      return { success: true };
    } finally {
      close();
    }
  } catch (e: any) {
    console.error("Failed to save draft to Gmail:", e);
    return { success: false, message: e.message || "Failed to save draft" };
  }
}

export async function markEmailReadAction(providerMessageId: string) {
  try {
    const user = await requireAuth();
    const { client, close } = await getMcpClient(user.id);
    
    try {
      await client.callTool({
        name: "mark_email",
        arguments: {
          account: "default",
          uid: providerMessageId,
          mailbox: "INBOX",
          flags: { read: true }
        }
      });
      
      await prisma.email.updateMany({
        where: { providerMessageId, userId: user.id },
        data: { isRead: true }
      });
      
      return { success: true };
    } finally {
      close();
    }
  } catch (e: any) {
    console.error("Failed to mark email as read:", e);
    return { success: false, message: e.message };
  }
}

export async function archiveEmailAction(emailId: string, providerMessageId: string) {
  try {
    const user = await requireAuth();
    const { client, close } = await getMcpClient(user.id);
    
    try {
      await client.callTool({
        name: "move_email",
        arguments: {
          account: "default",
          uid: providerMessageId,
          from_mailbox: "INBOX",
          to_mailbox: "[Gmail]/All Mail"
        }
      });
      
      await prisma.email.delete({
        where: { id: emailId, userId: user.id }
      });
      
      revalidatePath("/");
      return { success: true };
    } finally {
      close();
    }
  } catch (e: any) {
    console.error("Failed to archive email:", e);
    return { success: false, message: e.message || "Failed to archive email" };
  }
}

export async function searchEmailsAction(query: string) {
  try {
    const user = await requireAuth();
    const { client, close } = await getMcpClient(user.id);
    
    try {
      const response = await client.callTool({
        name: "search_emails",
        arguments: {
          account: "default",
          query: query,
          mailbox: "INBOX",
          limit: 20
        }
      });
      
      const dataStr = (response.content as any[])?.find((c: any) => c.type === 'text')?.text || "[]";
      let emails = [];
      try {
        emails = JSON.parse(dataStr);
      } catch (e) {
        emails = [];
      }
      
      // Format the raw emails into our EmailData type format so UI can render them
      const formattedEmails = emails.map((m: any) => ({
        id: "search-" + Math.random().toString(36).substr(2, 9),
        providerMessageId: m.uid || m.id,
        subject: m.subject || "No Subject",
        senderName: m.from || "Unknown",
        senderEmail: m.from || "",
        category: "Search Result",
        summary: m.snippet || "No snippet available",
        time: m.date ? new Date(m.date).toLocaleDateString() : new Date().toLocaleDateString(),
        isRead: true
      }));
      
      return { success: true, emails: formattedEmails };
    } finally {
      close();
    }
  } catch (e: any) {
    console.error("Failed to search emails:", e);
    return { success: false, message: e.message || "Failed to search emails" };
  }
}

export async function deleteEmailAction(emailId: string, providerMessageId: string) {
  try {
    const user = await requireAuth();
    const { client, close } = await getMcpClient(user.id);
    
    try {
      await client.callTool({
        name: "delete_email",
        arguments: {
          account: "default",
          uid: providerMessageId,
          mailbox: "INBOX",
          trash: true
        }
      });
      
      await prisma.email.delete({
        where: { id: emailId }
      });
      
      revalidatePath("/dashboard");
      return { success: true };
    } finally {
      close();
    }
  } catch (e: any) {
    console.error("Failed to delete email:", e);
    return { success: false, message: e.message || "Failed to delete email" };
  }
}

export async function listLabelsAction() {
  try {
    const user = await requireAuth();
    const { client } = await getMcpClient(user.id);
    const response = await client.callTool({
      name: "list_labels",
      arguments: { account: "default" }
    });
    
    const dataStr = (response.content as any[])?.find((c: any) => c.type === 'text')?.text || "[]";
    let labels = [];
    try {
      labels = JSON.parse(dataStr);
    } catch (e) {
      labels = [];
    }
    return { success: true, labels };
  } catch (e: any) {
    console.error("Failed to list labels:", e);
    return { success: false, message: e.message };
  }
}

export async function addLabelAction(emailId: string, providerMessageId: string, label: string) {
  try {
    const user = await requireAuth();
    const { client } = await getMcpClient(user.id);
    await client.callTool({
      name: "add_label",
      arguments: { account: "default", uid: providerMessageId, label }
    });
    
    const email = await prisma.email.findUnique({ where: { id: emailId }});
    if (email) {
      const currentLabels = email.labels ? email.labels.split(",").filter(l => l.trim()) : [];
      if (!currentLabels.includes(label)) {
        currentLabels.push(label);
        await prisma.email.update({
          where: { id: emailId },
          data: { labels: currentLabels.join(",") }
        });
      }
    }
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e: any) {
    console.error("Failed to add label:", e);
    return { success: false, message: e.message };
  }
}

export async function removeLabelAction(emailId: string, providerMessageId: string, label: string) {
  try {
    const user = await requireAuth();
    const { client } = await getMcpClient(user.id);
    await client.callTool({
      name: "remove_label",
      arguments: { account: "default", uid: providerMessageId, label }
    });
    
    const email = await prisma.email.findUnique({ where: { id: emailId }});
    if (email) {
      const currentLabels = email.labels ? email.labels.split(",").filter(l => l.trim()) : [];
      const newLabels = currentLabels.filter(l => l !== label);
      await prisma.email.update({
        where: { id: emailId },
        data: { labels: newLabels.join(",") }
      });
    }
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e: any) {
    console.error("Failed to remove label:", e);
    return { success: false, message: e.message };
  }
}

export async function getEmailStatsAction() {
  try {
    const user = await requireAuth();
    const { client } = await getMcpClient(user.id);
    const response = await client.callTool({
      name: "get_email_stats",
      arguments: { account: "default", days: 7 }
    });
    
    const dataStr = (response.content as any[])?.find((c: any) => c.type === 'text')?.text || "{}";
    let stats = {};
    try {
      stats = JSON.parse(dataStr);
    } catch (e) {
      stats = {};
    }
    return { success: true, stats };
  } catch (e: any) {
    console.error("Failed to get email stats:", e);
    return { success: false, message: e.message };
  }
}

export async function bulkArchiveAction(emailIds: string[], providerMessageIds: string[]) {
  try {
    const user = await requireAuth();
    const { client } = await getMcpClient(user.id);
    
    await client.callTool({
      name: "bulk_action",
      arguments: {
        account: "default",
        uids: providerMessageIds,
        action: "move",
        destination: "[Gmail]/All Mail"
      }
    });
    
    await prisma.email.deleteMany({
      where: { id: { in: emailIds } }
    });
    
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e: any) {
    console.error("Failed bulk archive:", e);
    return { success: false, message: e.message || "Bulk archive failed" };
  }
}
