'use client';

import { useState, useEffect } from 'react';
import { deleteRuleAction, getKnowledgeDataAction } from '../actions';
import { AddRuleForm } from './add-rule-form';
import { AddBulkKnowledgeForm } from './add-bulk-knowledge-form';
import { EmailStats } from '@/components/email-stats';
import { Brain, FileText, Trash2, HelpCircle } from 'lucide-react';

export default function KnowledgePage() {
  const [rules, setRules] = useState<{ id: string; title: string; content: string; createdAt: Date }[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<{ id: string; title: string; content: string; createdAt: Date }[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const { rulesData, knowledgeData } = await getKnowledgeDataAction();
      setRules(rulesData);
      setKnowledgeBase(knowledgeData);
    } catch (e) {
      console.error("Failed to fetch knowledge data", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setIsDeleting(true);
    try {
      await deleteRuleAction(id);
      setRules((prev) => prev.filter(r => r.id !== id));
      setKnowledgeBase((prev) => prev.filter(k => k.id !== id));
    } catch (error) {
      console.error('Delete failed', error);
    } finally {
      setDeletingId(null);
      setIsDeleting(false);
      fetchData(); // reload
    }
  };

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto space-y-12">
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-glow">
          <Brain className="w-5 h-5 text-primary text-glow" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-0.5">Knowledge Base</h1>
          <p className="text-muted-foreground text-xs">Train your AI copywriter with specific directives, company documents, and business context.</p>
        </div>
      </header>

      {/* Analytics Dashboard */}
      <section className="space-y-6">
        <EmailStats />
      </section>

      {/* RULES SECTION */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>AI Rules & Instructions</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Directives applied to draft emails (e.g., tone of voice, greeting style, or signatures).</p>
          </div>
          <AddRuleForm />
        </div>

        <div className="space-y-3">
          {rules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rules.map(item => (
                <div key={item.id} className="glass-panel rounded-2xl p-5 flex flex-col justify-between gap-5 transition-all duration-300 border border-white/5 hover:border-primary/20 hover:shadow-glow group">
                  <div>
                    <h4 className="font-bold text-white text-sm group-hover:text-primary transition-colors flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      {item.title}
                    </h4>
                    <p className="text-muted-foreground mt-3 text-xs leading-relaxed line-clamp-4">{item.content}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/5 pt-3">
                    <span className="text-[9px] text-zinc-500 font-mono">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-zinc-500 hover:text-destructive flex items-center gap-1 text-[11px] font-semibold transition-colors"
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {isDeleting && deletingId === item.id ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-8 text-center border border-white/5">
              <HelpCircle className="w-8 h-8 text-primary/30 mx-auto mb-3" />
              <p className="text-sm font-semibold text-white mb-1">No custom instructions yet</p>
              <p className="text-xs text-muted-foreground">Click "Add AI Rule" above to specify custom instructions.</p>
            </div>
          )}
        </div>
      </section>

      <hr className="border-white/5" />

      {/* RAG SECTION */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white">Context Ingestion (RAG)</h2>
          <p className="text-xs text-muted-foreground mt-1">Paste extensive texts like handbooks, pricing, or product descriptions. AI retrieves these to write drafts.</p>
        </div>

        <div className="glass rounded-3xl p-6 border border-white/5">
          <AddBulkKnowledgeForm />
        </div>

        {knowledgeBase.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest text-glow">
              Indexed Documents ({knowledgeBase.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {knowledgeBase.map(item => (
                <div key={item.id} className="glass-panel rounded-2xl p-5 flex flex-col justify-between gap-5 transition-all duration-300 border border-white/5 hover:border-primary/20 hover:shadow-glow group">
                  <div>
                    <h4 className="font-bold text-white text-sm truncate group-hover:text-primary transition-colors flex items-center gap-2" title={item.title}>
                      <Brain className="w-4 h-4 text-primary" />
                      {item.title}
                    </h4>
                    <p className="text-muted-foreground mt-3 text-xs leading-relaxed line-clamp-3">{item.content}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/5 pt-3">
                    <span className="text-[9px] text-zinc-500 font-mono">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-zinc-500 hover:text-destructive flex items-center gap-1 text-[11px] font-semibold transition-colors"
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {isDeleting && deletingId === item.id ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}