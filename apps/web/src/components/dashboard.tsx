"use client";

import { useState } from "react";
import Link from "next/link";
import { EmailData } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Inbox, Star, User, Clock, ArrowRight, Zap, Play, Settings2, Brain, Tag, FileText, Bell, ShoppingBag, Briefcase, Mail, AlertCircle, Send, Users, Edit2, Copy, Check, Sparkles, MessageSquare } from "lucide-react";
import { connectLinkedInAction, updateDraftAction, sendLinkedInMessageAction, updateCategoryAction } from "@/app/actions";
import { Loader2 } from "lucide-react";
import { SyncButton } from "@/app/sync-button";
import { SyncLinkedInButton } from "@/app/sync-linkedin-button";

const getCategoryIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes("reply") || cat.includes("action")) return <Send className="w-4 h-4 text-primary" />;
  if (cat.includes("newsletter") || cat.includes("promotion")) return <Mail className="w-4 h-4 text-emerald-400" />;
  if (cat.includes("receipt") || cat.includes("order") || cat.includes("invoice")) return <ShoppingBag className="w-4 h-4 text-amber-400" />;
  if (cat.includes("alert") || cat.includes("notification")) return <Bell className="w-4 h-4 text-rose-400" />;
  if (cat.includes("important") || cat.includes("urgent")) return <AlertCircle className="w-4 h-4 text-red-500" />;
  if (cat.includes("personal") || cat.includes("family")) return <Users className="w-4 h-4 text-indigo-400" />;
  if (cat.includes("work") || cat.includes("project")) return <Briefcase className="w-4 h-4 text-blue-400" />;
  if (cat.includes("ignore") || cat.includes("trash")) return <Tag className="w-4 h-4 text-zinc-500" />;
  return <FileText className="w-4 h-4 text-muted-foreground" />;
};

function OriginalMessageView({ content }: { content: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  let headerContent = "";
  let displayContent = content;

  const lines = content.trimStart().split('\n');

  if (lines.length > 2 && (lines[1].startsWith('Status:') || lines[0].startsWith('Status:'))) {
    let bodyStartIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (i === 0 && !line.includes('Status:') && !line.includes('From:')) {
        continue;
      }

      if (line.startsWith('Status:') || line.startsWith('From:') || line.startsWith('Date:') || line.startsWith('Attachments:')) {
        bodyStartIndex = i + 1;
      } else {
        if (line === '') {
          bodyStartIndex = i + 1;
        }
        break;
      }
    }

    if (bodyStartIndex > 0) {
      headerContent = lines.slice(0, bodyStartIndex).join('\n').trim();
      displayContent = lines.slice(bodyStartIndex).join('\n').trim();
    }
  }

  const isLong = displayContent.length > 500 || displayContent.split('\n').length > 10;

  return (
    <div className="glass-panel rounded-2xl p-6 mb-8 relative border border-white/5 overflow-hidden transition-all duration-300 hover:border-white/10">
      <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4" /> Original Message
      </h3>
      <div className="relative">
        {headerContent && (
          <div className="mb-5 p-4 rounded-xl bg-black/50 border border-white/5 font-mono text-[11px] leading-[1.7] text-muted-foreground/60 whitespace-pre-wrap">
            {headerContent}
          </div>
        )}
        <div
          className={`text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed break-words ${!isExpanded && isLong ? "max-h-[250px] overflow-hidden" : ""}`}
        >
          {displayContent}
        </div>
        {!isExpanded && isLong && (
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050505] to-transparent flex items-end justify-center">
            <button
              onClick={() => setIsExpanded(true)}
              className="text-[11px] font-bold uppercase tracking-wider text-primary bg-[#0a0a0a] px-5 py-2.5 rounded-full border border-primary/20 hover:bg-primary/10 transition-all hover:scale-105 shadow-glow mb-2 relative z-10"
            >
              View More
            </button>
          </div>
        )}
      </div>
      {isExpanded && isLong && (
        <div className="mt-4 flex justify-center border-t border-white/5 pt-4">
          <button
            onClick={() => setIsExpanded(false)}
            className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            Show Less
          </button>
        </div>
      )}
    </div>
  );
}

interface DashboardProps {
  emails: EmailData[];
  categories: string[];
  inboxType?: string;
  linkedInConnected?: boolean;
  userEmail?: string;
  lastEmailSync?: Date | null;
  lastLinkedInSync?: Date | null;
}

export function Dashboard({ emails, categories, inboxType = "email", linkedInConnected = true, userEmail, lastEmailSync, lastLinkedInSync }: DashboardProps) {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(categories.length > 0 ? categories[0] : "empty");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDraft, setEditedDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(emails.length > 0 && true);

  const groupedEmails = emails.reduce((acc, email) => {
    const cat = email.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(email);
    return acc;
  }, {} as Record<string, typeof emails>);

  const activeEmails = groupedEmails[activeTab] || [];
  const selectedEmail = emails.find(e => e.id === selectedEmailId);

  const handleConnectLinkedIn = async () => {
    setIsConnecting(true);
    try {
      await connectLinkedInAction();
    } catch (e) {
      console.error(e);
    }
    setIsConnecting(false);
  };

  const handleCopy = () => {
    if (!selectedEmail?.draftReply) return;
    navigator.clipboard.writeText(selectedEmail.draftReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendReply = async () => {
    if (!selectedEmail?.draftReply) return;

    if (inboxType === "email") {
      const subject = selectedEmail.subject.startsWith("Re:")
        ? selectedEmail.subject
        : `Re: ${selectedEmail.subject}`;
      const to = selectedEmail.senderEmail;
      const body = encodeURIComponent(selectedEmail.draftReply);
      
      const authUserPath = userEmail ? `/u/${userEmail}` : "";
      const gmailUrl = `https://mail.google.com/mail${authUserPath}/?view=cm&fs=1&to=${to}&su=${encodeURIComponent(subject)}&body=${body}`;
      
      if (typeof window !== "undefined" && (window as any).electronAPI?.openExternal) {
        (window as any).electronAPI.openExternal(gmailUrl);
      } else {
        window.open(gmailUrl, "_blank", "noopener,noreferrer,width=1000,height=800");
      }
      
    } else if (inboxType === "linkedin") {
      setIsSending(true);
      
      const linkedinUsername = selectedEmail.senderName;
      const res = await sendLinkedInMessageAction(selectedEmail.id, linkedinUsername, selectedEmail.draftReply);
      setIsSending(false);
      
      if (res.success) {
        setSelectedEmailId(null);
      } else {
        console.warn("MCP Send Failed, falling back to manual:", res.message);
        if (selectedEmail.draftReply) {
          navigator.clipboard.writeText(selectedEmail.draftReply);
        }
        const threadId = selectedEmail.providerMessageId;
        const isRealThreadId = threadId && !threadId.includes(" ") && !threadId.includes("%20") && (threadId.startsWith("2-") || threadId.startsWith("urn:"));
        const linkedinUrl = isRealThreadId 
          ? `https://www.linkedin.com/messaging/thread/${threadId}/` 
          : "https://www.linkedin.com/messaging/";
        
        if (typeof window !== "undefined" && (window as any).electronAPI?.openExternal) {
          (window as any).electronAPI.openExternal(linkedinUrl);
        } else {
          window.open(linkedinUrl, "_blank", "noopener,noreferrer,width=1000,height=800");
        }
        alert("Automated sending failed: " + res.message + "\n\nOpened LinkedIn directly. Please paste your message and send manually.");
      }
    }
  };

  if (inboxType === "linkedin" && !linkedInConnected) {
    return (
      <div className="flex h-full w-full overflow-hidden bg-background items-center justify-center p-6">
        <div className="max-w-md w-full p-8 glass border border-white/10 rounded-3xl shadow-glow flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 shadow-glow">
            <MessageSquare className="w-8 h-8 text-primary drop-shadow-[0_0_6px_rgba(30,212,60,0.5)]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Connect your LinkedIn</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            Sync your LinkedIn messages securely via the local MCP server. A secure window will temporarily open to let you link your profile.
          </p>
          <button 
            onClick={handleConnectLinkedIn}
            disabled={isConnecting}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 px-4 rounded-xl hover:scale-[1.02] hover:shadow-glow transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {isConnecting ? "Waiting for auth..." : "Secure Connection"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* Pane 1 - Categories Sidebar */}
      <div className="w-[240px] border-r border-white/5 bg-black/20 flex flex-col flex-shrink-0 backdrop-blur-md">
        <div className="p-5 border-b border-white/5 bg-black/10 flex items-center h-[72px]">
          <h3 className="text-[10px] font-bold text-primary/70 uppercase tracking-[0.25em] pl-1 text-glow">Inbox Sections</h3>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1.5">
            {categories.map(cat => {
              const isActive = activeTab === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveTab(cat);
                    setSelectedEmailId(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 border ${isActive
                      ? "bg-primary/10 text-primary border-primary/25 shadow-glow scale-[1.02]"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground border-transparent"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(cat)}
                    <span className="truncate max-w-[125px] text-left">{cat}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-all ${isActive ? "bg-primary/20 text-primary" : "bg-white/10 text-foreground/80"
                    }`}>
                    {groupedEmails[cat]?.length || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Pane 2 - Email List */}
      <div className="w-[360px] border-r border-white/5 bg-black/35 flex flex-col flex-shrink-0 backdrop-blur-sm">
        <div className="p-4 border-b border-white/5 bg-black/10 flex items-center justify-between h-[72px]">
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            {inboxType === "linkedin" ? <MessageSquare className="w-5 h-5 text-primary" /> : <Inbox className="w-5 h-5 text-primary" />}
            Triage
          </h2>
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-2 scale-90 origin-right">
              {inboxType === "linkedin" ? (
                <SyncLinkedInButton inline />
              ) : userEmail ? (
                <SyncButton inline />
              ) : null}
            </div>
            <span className="text-[9px] text-muted-foreground mr-1">
              Synced: {(inboxType === "linkedin" ? lastLinkedInSync : lastEmailSync) 
                ? new Date(inboxType === "linkedin" ? lastLinkedInSync! : lastEmailSync!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                : "Never"}
            </span>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {inboxType === "email" && !userEmail ? (
              <div className="flex flex-col items-center justify-center text-muted-foreground/60 p-6 text-center mt-12 animate-in fade-in duration-700">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20 shadow-glow">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm font-bold text-white mb-2">Email Not Connected</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                  Please connect your IMAP email account in Settings to start synchronizing and triaging.
                </p>
                <Link 
                  href="/settings"
                  className="bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-xl hover:scale-[1.02] hover:shadow-glow transition-all active:scale-[0.98] text-xs"
                >
                  Connect Email
                </Link>
              </div>
            ) : emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-muted-foreground/60 p-6 text-center mt-12 animate-in fade-in duration-700">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20 shadow-glow">
                  <Inbox className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm font-bold text-white mb-2">Inbox Connected!</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                  Ready to analyze your inbox. Click below to start sync.
                </p>
                {inboxType === "linkedin" ? <SyncLinkedInButton /> : <SyncButton />}
              </div>
            ) : activeEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/60 p-6 text-center animate-in fade-in duration-500">
                <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4 border border-white/5">
                  <Check className="w-8 h-8 text-primary/40" />
                </div>
                <p className="text-sm font-bold text-white">Inbox Zero!</p>
                <p className="text-xs text-muted-foreground mt-1">Everything triaged in this category.</p>
              </div>
            ) : (
              activeEmails.map((email) => (
                <button
                  key={email.id}
                  onClick={() => setSelectedEmailId(email.id)}
                  className={`w-full text-left p-5 transition-all duration-300 relative group flex gap-4 border border-white/5 rounded-2xl ${
                    selectedEmailId === email.id
                      ? 'bg-primary/10 border-primary/30 shadow-glow scale-[0.98]'
                      : 'hover:bg-white/5 bg-black/20 border-white/5'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary font-bold text-md border border-primary/20">
                    {email.senderName.charAt(0).toUpperCase()}
                  </div>
                  {showTooltip && emails[0]?.id === email.id && (
                    <div className="absolute left-full ml-4 z-50 w-64 glass border border-white/10 p-4 rounded-2xl shadow-glow text-xs text-muted-foreground animate-in fade-in slide-in-from-left-4">
                      <div className="absolute top-1/2 -left-2 -mt-2 w-4 h-4 bg-black border-l border-b border-white/10 transform rotate-45"></div>
                      <div className="relative z-10 space-y-2">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-primary" /> AI Triaged
                        </span>
                        <p>Select any item to review AI summary context, reasoning tags, and ready-to-send draft replies.</p>
                        <button onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }} className="text-primary font-semibold hover:underline">Dismiss tip</button>
                      </div>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`font-bold text-xs truncate pr-2 ${selectedEmailId === email.id ? 'text-primary text-glow' : 'text-white'}`}>
                        {email.senderName}
                      </span>
                      <span className="text-[9px] text-muted-foreground/80 font-mono whitespace-nowrap mt-0.5">{email.time}</span>
                    </div>
                    <div className="text-xs font-semibold text-foreground/90 truncate mb-1.5">{email.subject}</div>
                    <div className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {email.summary}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Pane 3 - Email Detail */}
      <div className="flex-1 bg-background flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto">
          {selectedEmail ? (
            <div className="max-w-3xl mx-auto p-8 animate-in fade-in duration-500">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-5 flex-wrap">
                  <div className="flex items-center">
                    <select
                      value={selectedEmail.category || ""}
                      onChange={(e) => {
                        updateCategoryAction(selectedEmail.id, e.target.value, inboxType as "email" | "linkedin");
                      }}
                      className="bg-primary/10 text-primary border border-primary/20 text-xs font-bold px-3 py-1 rounded-full outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer pr-7"
                      style={{ backgroundImage: "url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231ed43c%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0.6rem top 50%", backgroundSize: "0.65rem auto" }}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat} className="bg-background text-foreground font-semibold">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedEmail.replyNeeded && (
                    <Badge variant="outline" className="badge-semantic bg-blue-500/10 text-blue-400 border-blue-500/20">
                      Needs Reply
                    </Badge>
                  )}
                  {selectedEmail.priority !== undefined && (
                    <Badge variant="outline" className="badge-semantic bg-orange-500/10 text-orange-400 border-orange-500/20">
                      Priority: {selectedEmail.priority}/5
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-white mb-5 leading-tight">{selectedEmail.subject}</h1>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-md border border-primary/20 shadow-glow">
                    {selectedEmail.senderName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{selectedEmail.senderName}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{selectedEmail.senderEmail}</div>
                  </div>
                </div>
              </div>

              {/* AI Insights Card */}
              <div className="glass rounded-3xl p-6 mb-6 relative overflow-hidden border border-primary/20 shadow-glow">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary shadow-[0_0_15px_#1ed43c]"></div>
                <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-primary flex items-center gap-2 mb-3 text-glow">
                  <Brain className="w-4 h-4" /> AI Summary & Triage Insight
                </h3>
                <p className="text-foreground/90 text-sm leading-relaxed">
                  {selectedEmail.summary}
                </p>
              </div>

              {selectedEmail.originalBody && (
                <OriginalMessageView content={selectedEmail.originalBody} />
              )}

              {/* Suggested Reply Area */}
              {selectedEmail.draftReply && (
                <div className="glass rounded-3xl p-6 shadow-glow border border-primary/20 transition-all duration-300">
                  <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-primary flex items-center gap-2 mb-4 text-glow">
                    <Sparkles className="w-4 h-4" /> AI Drafted Response
                  </h3>
                  
                  {isEditing ? (
                    <div className="bg-[#050505] rounded-xl p-4 border border-white/5 text-sm text-foreground/90 whitespace-pre-wrap font-mono leading-relaxed focus-within:border-primary/45 transition-all">
                      <textarea
                        value={editedDraft}
                        onChange={(e) => setEditedDraft(e.target.value)}
                        className="w-full h-40 p-1 border-none outline-none text-xs text-foreground bg-transparent font-mono leading-relaxed resize-none focus:ring-0"
                      />
                    </div>
                  ) : (
                    <div className="bg-[#050505] rounded-xl p-5 border border-white/5 text-xs text-foreground/90 whitespace-pre-wrap font-mono leading-relaxed select-text">
                      {selectedEmail.draftReply}
                    </div>
                  )}

                  {isEditing ? (
                    <div className="mt-5 flex gap-3">
                      <button
                        onClick={() => {
                          updateDraftAction(selectedEmail.id, editedDraft, selectedEmail.category === "email" ? "email" : "linkedin");
                          setIsEditing(false);
                          setEditedDraft("");
                        }}
                        className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-xs font-bold hover:scale-[1.02] transition-all shadow-glow active:scale-[0.98]"
                      >
                        Save Draft
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditedDraft("");
                        }}
                        className="bg-white/5 text-foreground px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-white/10 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="mt-5 flex gap-2 flex-wrap">
                      <button
                        onClick={handleSendReply}
                        disabled={isSending}
                        className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-xs font-bold hover:scale-[1.02] transition-all shadow-glow active:scale-[0.98] disabled:opacity-50 flex items-center justify-center min-w-[150px]"
                      >
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : (inboxType === "linkedin" ? "Reply on LinkedIn" : "Send Draft via Gmail")}
                      </button>
                      <button
                        onClick={handleCopy}
                        disabled={isSending}
                        className="bg-white/5 text-foreground px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                      <button
                        onClick={() => {
                          setEditedDraft(selectedEmail.draftReply || "");
                          setIsEditing(true);
                        }}
                        className="bg-white/5 text-foreground px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-white/10 transition-colors flex items-center gap-1.5"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/60 p-8 select-none">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/2 blur-3xl rounded-full"></div>
                <div className="w-24 h-24 rounded-3xl bg-black/40 backdrop-blur-xl border border-primary/20 flex items-center justify-center mb-8 relative shadow-glow">
                  <Zap className="w-12 h-12 text-primary drop-shadow-[0_0_10px_rgba(30,212,60,0.4)]" fill="currentColor" />
                </div>
              </div>

              {inboxType === "email" && !userEmail ? (
                <div className="flex flex-col items-center justify-center text-center w-full max-w-md mx-auto animate-in fade-in duration-700">
                  <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Email Connection Required</h3>
                  <p className="text-xs text-muted-foreground/80 leading-relaxed mb-8">
                    To start automated triaging, context indexing, and draft generation, connect your IMAP email account.
                  </p>
                  <Link 
                    href="/settings"
                    className="bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-xl hover:scale-[1.02] hover:shadow-glow transition-all active:scale-[0.98] text-xs"
                  >
                    Configure Connection
                  </Link>
                </div>
              ) : emails.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center w-full max-w-md mx-auto animate-in fade-in duration-1000">
                  <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Syncing inbox may take a moment</h3>
                  <p className="text-xs text-muted-foreground/80 leading-relaxed mb-8">
                    TriageAI leverages Claude to retrieve your latest correspondence, structure categories, flag urgent issues, and craft drafts for you.
                  </p>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary/50 w-1/3 animate-pulse rounded-full"></div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center animate-in fade-in duration-700">
                  <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Ready to Triage</h3>
                  <p className="max-w-md text-xs text-muted-foreground/80 leading-relaxed mb-8">
                    Select a correspondence item from the left feed to read the full context, view categorization reasoning, and review draft actions.
                  </p>

                  <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
                    <div className="glass rounded-2xl p-4 text-center border border-white/5">
                      <div className="text-2xl font-black text-white mb-1">{emails.filter(e => e.replyNeeded).length}</div>
                      <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Needs Action</div>
                    </div>
                    <div className="glass rounded-2xl p-4 text-center border border-primary/20 shadow-glow">
                      <div className="text-2xl font-black text-primary mb-1 text-glow">{emails.filter(e => e.category === 'Important' || e.priority === 5).length}</div>
                      <div className="text-[9px] uppercase tracking-widest font-bold text-primary/80">High Priority</div>
                    </div>
                    <div className="glass rounded-2xl p-4 text-center border border-white/5">
                      <div className="text-2xl font-black text-white mb-1">{emails.length}</div>
                      <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Total Feed</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
