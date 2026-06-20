"use client";

import { useState } from "react";
import { addBulkKnowledgeAction } from "../actions";

export function AddBulkKnowledgeForm() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    const res = await addBulkKnowledgeAction(content);
    if (res.success) {
      setContent("");
      setSuccess(`Successfully ingested ${res.chunksProcessed} chunks!`);
    } else {
      setError(res.message || "Failed to ingest knowledge");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <textarea
        placeholder="Paste your entire company handbook, FAQs, or massive blocks of text here. The system will automatically chunk it and vectorize it."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        rows={6}
        className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary transition-all resize-y leading-relaxed"
        disabled={loading}
      />
      {error && (
        <p className="text-destructive text-xs font-semibold">{error}</p>
      )}
      {success && (
        <p className="text-primary text-xs font-semibold">{success}</p>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="bg-primary hover:scale-[1.01] hover:shadow-glow text-primary-foreground text-xs px-6 py-2.5 rounded-xl font-bold transition-all active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? "Processing & Vectorizing..." : "Ingest Context"}
        </button>
      </div>
    </form>
  );
}
