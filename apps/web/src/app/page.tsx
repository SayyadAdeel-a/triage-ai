import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailCard } from "@/components/email-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Nav } from "@/components/nav";
import { SyncButton } from "./sync-button";
import { AddCategoryButton } from "./add-category-button";
import { AutoSyncToggle } from "./auto-sync-toggle";
import { DemoInboxButton } from "./demo-inbox-button";
import { MorningBriefingBanner } from "./morning-briefing";
import { ReProcessButton } from "./re-process-button";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const [emails, dbCategories] = await Promise.all([
    prisma.email.findMany({ orderBy: { time: 'desc' } }),
    prisma.category.findMany({ orderBy: { name: 'asc' } })
  ]);

  const formatEmail = (email: any) => ({
    ...email,
    time: email.time.toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
  });

  // Group emails dynamically
  const groupedEmails = emails.reduce((acc, email) => {
    const cat = email.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(email);
    return acc;
  }, {} as Record<string, typeof emails>);

  // All valid categories from the DB
  const categories = dbCategories.map(c => c.name);

  // If there are grouped emails that don't match a DB category, add them to the UI
  Object.keys(groupedEmails).forEach(cat => {
    if (!categories.includes(cat)) categories.push(cat);
  });

  // Sort categories: put Action/Reply ones first
  categories.sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    if (aLower.includes("needs reply") || aLower.includes("action")) return -1;
    if (bLower.includes("needs reply") || bLower.includes("action")) return 1;
    return 0;
  });

  const defaultCategory = categories.length > 0 ? categories[0] : "empty";

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col items-center py-4 px-4 sm:px-6 lg:px-8">
      <Nav />
      <div className="w-full max-w-3xl mt-4">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">TriageAI</h1>
          <p className="mt-2 text-lg text-gray-500">60-second inbox clarity generator</p>
        </header>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <MorningBriefingBanner />
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4 gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">What needs your attention today</h2>
              <p className="text-sm text-gray-500">
                {emails.length === 0 ? "Inbox is empty. Connect and sync." : 
                 `We synced ${emails.length} emails into your categories.`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <AutoSyncToggle />
              <ReProcessButton />
              <SyncButton />
              <AddCategoryButton />
            </div>
          </div>

          {(emails.length > 0 || categories.length > 0) ? (
            <Tabs defaultValue={defaultCategory} className="w-full">
              <div className="w-full overflow-x-auto pb-2 mb-4 scrollbar-hide">
                <TabsList className="inline-flex w-max min-w-full bg-gray-100 p-1 rounded-lg">
                  {categories.map(cat => (
                    <TabsTrigger key={cat} value={cat} className="rounded-md px-4">
                      {cat} <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs font-bold">{groupedEmails[cat]?.length || 0}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <ScrollArea className="h-[600px] pr-4">
                {categories.map(cat => (
                  <TabsContent key={cat} value={cat} className="mt-0">
                    {(groupedEmails[cat] || []).map(email => (
                      <EmailCard key={email.id} email={formatEmail(email) as any} allCategories={categories} />
                    ))}
                    {(!groupedEmails[cat] || groupedEmails[cat].length === 0) && (
                      <p className="text-center text-gray-500 mt-10 py-8">No emails in {cat}.</p>
                    )}
                  </TabsContent>
                ))}
              </ScrollArea>
            </Tabs>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No emails synced yet. Hit the Sync button!</p>
              <DemoInboxButton />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
