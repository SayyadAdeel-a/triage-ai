"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Inbox, Brain, Settings, Zap, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar({ isEmailConnected = false, isLinkedInConnected = false }: { isEmailConnected?: boolean; isLinkedInConnected?: boolean; }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inboxType = searchParams.get("inbox") || "email";

  const isEmailInboxActive = (pathname === "/" && inboxType !== "linkedin") || pathname === "/onboarding";
  const isLinkedInInboxActive = pathname === "/" && inboxType === "linkedin";
  const isKnowledgeActive = pathname === "/knowledge";
  const isAutopilotActive = pathname === "/settings/autopilot";
  const isSettingsActive = pathname === "/settings";

  return (
    <aside className="w-64 h-full border-r border-white/5 bg-black/30 backdrop-blur-3xl flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tighter flex items-center gap-2 text-white">
          <Zap className="w-6 h-6 text-primary fill-primary/10 filter drop-shadow-[0_0_8px_rgba(30,212,60,0.5)]" />
          <span>TriageAI</span>
        </h1>
        <p className="text-[10px] text-primary/70 mt-1.5 tracking-[0.15em] uppercase font-bold text-glow">Desktop Edition</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        <Link
          href="/?inbox=email"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-sm font-medium border",
            isEmailInboxActive
              ? "bg-primary/10 text-primary border-primary/20 shadow-glow"
              : "border-transparent hover:bg-white/5 text-muted-foreground hover:text-foreground"
          )}
        >
          <Inbox className={cn("w-4 h-4 transition-colors", isEmailInboxActive ? "text-primary" : "text-muted-foreground")} />
          Email Inbox
        </Link>
        <Link
          href="/?inbox=linkedin"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-sm font-medium border",
            isLinkedInInboxActive
              ? "bg-primary/10 text-primary border-primary/20 shadow-glow"
              : "border-transparent hover:bg-white/5 text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageSquare className={cn("w-4 h-4 transition-colors", isLinkedInInboxActive ? "text-primary" : "text-muted-foreground")} />
          LinkedIn
        </Link>
        <Link
          href="/knowledge"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-sm font-medium border",
            isKnowledgeActive
              ? "bg-primary/10 text-primary border-primary/20 shadow-glow"
              : "border-transparent hover:bg-white/5 text-muted-foreground hover:text-foreground"
          )}
        >
          <Brain className={cn("w-4 h-4 transition-colors", isKnowledgeActive ? "text-primary" : "text-muted-foreground")} />
          Knowledge Base
        </Link>
        <Link
          href="/settings/autopilot"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-sm font-medium border",
            isAutopilotActive
              ? "bg-primary/10 text-primary border-primary/20 shadow-glow"
              : "border-transparent hover:bg-white/5 text-muted-foreground hover:text-foreground"
          )}
        >
          <Zap className={cn("w-4 h-4 transition-colors", isAutopilotActive ? "text-primary" : "text-muted-foreground")} />
          Autopilot
        </Link>
      </nav>

      <div className="p-4 mt-auto border-t border-white/5">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-sm font-medium border",
            isSettingsActive
              ? "bg-primary/10 text-primary border-primary/20 shadow-glow"
              : "border-transparent hover:bg-white/5 text-muted-foreground hover:text-foreground"
          )}
        >
          <Settings className={cn("w-4 h-4 transition-colors", isSettingsActive ? "text-primary" : "text-muted-foreground")} />
          Settings
        </Link>
      </div>
    </aside>
  );
}
