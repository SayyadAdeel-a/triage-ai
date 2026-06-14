"use client";

import { useState } from "react";
import { addRuleAction } from "../actions";

export function AddRuleForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    
    setLoading(true);
    const res = await addRuleAction(title, content);
    if (res.success) {
      setTitle("");
      setContent("");
    } else {
      alert(res.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="Rule Title (e.g. Tone of Voice, Signature)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        disabled={loading}
      />
      <textarea
        placeholder="Instructions (e.g. 'Always keep replies under 3 sentences and sign off with Cheers, Adeel')"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        rows={3}
        className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-y"
        disabled={loading}
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !title.trim() || !content.trim()}
          className="bg-black hover:bg-gray-800 text-white text-sm px-6 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "Saving..." : "Add AI Rule"}
        </button>
      </div>
    </form>
  );
}
