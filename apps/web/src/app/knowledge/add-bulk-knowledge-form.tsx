"use client";

import { useState } from "react";
import { addBulkKnowledgeAction } from "../actions";

export function AddBulkKnowledgeForm() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setLoading(true);
    const res = await addBulkKnowledgeAction(content);
    if (res.success) {
      setContent("");
      alert(`Successfully ingested ${res.chunksProcessed} chunks!`);
    } else {
      alert(res.message);
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
        className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-y"
        disabled={loading}
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-6 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "Processing & Vectorizing..." : "Ingest Knowledge"}
        </button>
      </div>
    </form>
  );
}
