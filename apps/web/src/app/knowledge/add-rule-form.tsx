"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { addRuleAction } from "@/app/actions";

export function AddRuleForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await addRuleAction(title, content);
      if (res.success) {
        setTitle("");
        setContent("");
        setSuccess("Rule added successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(res.message || "Failed to add rule");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="bg-primary text-primary-foreground hover:scale-[1.01] hover:shadow-glow text-xs px-5 py-2.5 rounded-xl font-bold transition-all active:scale-[0.99] cursor-pointer">
        Add AI Rule
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] glass border-white/10 rounded-3xl p-6 shadow-glow animate-in fade-in duration-300">
        <DialogHeader>
          <DialogTitle className="text-white font-bold tracking-tight text-lg">Add AI Rule</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <input
              type="text"
              placeholder="Rule Title (e.g. Tone of Voice, Signature)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>
          <div>
            <textarea
              placeholder="Instructions (e.g. 'Always keep replies under 3 sentences and sign off with Cheers, John')"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              required
              className="w-full bg-[#050505] border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary transition-all resize-y leading-relaxed"
            />
          </div>
          {error && <p className="text-destructive text-xs font-semibold">{error}</p>}
          {success && <p className="text-primary text-xs font-semibold">{success}</p>}
          
          <DialogFooter className="mt-6 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError(null);
                setSuccess(null);
              }}
              className="bg-white/5 border border-white/5 text-white font-bold rounded-xl hover:bg-white/10 text-xs px-5 py-2.5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !content.trim()}
              className="bg-primary text-primary-foreground font-bold rounded-xl hover:scale-[1.01] hover:shadow-glow text-xs px-5 py-2.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Saving..." : "Add AI Rule"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
