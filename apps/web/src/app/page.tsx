export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { prisma } from "@/lib/prisma";
import { Dashboard } from "@/components/dashboard";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_EMAIL_CATEGORIES, DEFAULT_LINKEDIN_CATEGORIES } from "@/lib/constants";

export default async function Home({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const resolvedParams = await searchParams;
  const inbox = resolvedParams.inbox === "linkedin" ? "linkedin" : "email";

  const config = await prisma.appConfig.findUnique({ where: { userId: user.id } });
  
  if (!config || (!config.imapEmail && !config.linkedInConnected)) {
    redirect('/onboarding');
  }

  let messages = [];
  let dbCategories = [];

  if (inbox === "linkedin") {
    const [linkedInMsgs, categories] = await Promise.all([
      prisma.linkedInMessage.findMany({ where: { userId: user.id }, orderBy: { time: 'desc' }, take: 100 }),
      prisma.category.findMany({ where: { userId: user.id }, orderBy: { name: 'asc' } })
    ]);
    messages = linkedInMsgs;
    dbCategories = categories;
  } else {
    const [emailsList, categories] = await Promise.all([
      prisma.email.findMany({ where: { userId: user.id }, orderBy: { time: 'desc' }, take: 100 }),
      prisma.category.findMany({ where: { userId: user.id }, orderBy: { name: 'asc' } })
    ]);
    messages = emailsList;
    dbCategories = categories;
  }

  const formattedEmails = messages.map(msg => ({
    ...msg,
    // Add senderEmail fallback since LinkedInMessage might not have it
    senderEmail: (msg as any).senderEmail || "LinkedIn",
    time: msg.time.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
  }));

  const allowedCategories = inbox === "linkedin" 
    ? DEFAULT_LINKEDIN_CATEGORIES 
    : DEFAULT_EMAIL_CATEGORIES;

  const categoriesSet = new Set<string>();
  
  // Only add categories that are allowed for this inbox type
  dbCategories.forEach(c => {
    if ((allowedCategories as readonly string[]).includes(c.name)) {
      categoriesSet.add(c.name);
    }
  });
  
  messages.forEach(msg => {
    if (msg.category && (allowedCategories as readonly string[]).includes(msg.category)) {
      categoriesSet.add(msg.category);
    }
  });

  // Ensure all defaults are present in the list even if they don't have messages
  allowedCategories.forEach(cat => {
    categoriesSet.add(cat);
  });

  const categories = Array.from(categoriesSet);

  // Sort categories by predefined priority
  const categoryPriority = [
    "Needs Reply",
    "Important",
    "Sensitive",
    "Google Alerts",
    "Notifications",
    "Newsletters",
    "Promotions",
    "Investment/VC",
    "Partnership",
    "Talent/Hiring",
    "Sales/Lead",
    "General Network",
    "Spam/Pitch",
    "Market Research",
    "Ignore"
  ];

  categories.sort((a, b) => {
    const indexA = categoryPriority.indexOf(a);
    const indexB = categoryPriority.indexOf(b);
    
    // If both are in the priority list, sort by their index
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    // If only A is in the list, A comes first
    if (indexA !== -1) return -1;
    // If only B is in the list, B comes first
    if (indexB !== -1) return 1;
    
    // Fallback to alphabetical for any unknown categories
    return a.localeCompare(b);
  });

  return <Dashboard 
    emails={formattedEmails as any} 
    categories={categories} 
    inboxType={inbox} 
    linkedInConnected={config.linkedInConnected} 
    userEmail={config.imapEmail || undefined}
    lastEmailSync={config.lastEmailSync}
    lastLinkedInSync={config.lastLinkedInSync}
  />;
}
