import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarWrapper } from "@/components/sidebar-wrapper";
import { AutoSyncRunner } from "@/components/auto-sync-runner";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TriageAI - Smart Inbox Manager",
  description: "AI-powered email and LinkedIn inbox manager for founders and CEOs",
  icons: {
    icon: "/triageai_icon_mark.jpg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let config = null;
  if (user) {
    config = await prisma.appConfig.findUnique({
      where: { userId: user.id }
    });
  }

  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased dark`}
    >
      <body className="h-full flex overflow-hidden">
        <AutoSyncRunner 
          initialEmailAutoSync={config?.autoSyncEmail ?? false}
          initialLinkedinAutoSync={config?.autoSyncLinkedIn ?? false}
          initialEmailInterval={config?.autoSyncIntervalEmail ?? 30}
          initialLinkedinInterval={config?.autoSyncIntervalLinkedIn ?? 60}
        />
        <Suspense fallback={<aside className="w-64 h-full border-r border-white/5 bg-[#050505]" />}>
          <SidebarWrapper />
        </Suspense>
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </body>
    </html>
  );
}
