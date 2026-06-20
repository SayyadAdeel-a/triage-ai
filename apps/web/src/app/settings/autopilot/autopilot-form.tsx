"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Save, Zap, Inbox, MessageSquare } from "lucide-react";
import { saveAutopilotConfigAction } from "../actions";

interface AutopilotFormProps {
  initialConfig: {
    autoSyncEmail: boolean;
    autoSyncLinkedIn: boolean;
    autoSyncIntervalEmail: number;
    autoSyncIntervalLinkedIn: number;
  } | null;
}

export function AutopilotForm({ initialConfig }: AutopilotFormProps) {
  const [emailAutoSync, setEmailAutoSync] = useState(initialConfig?.autoSyncEmail ?? true);
  const [linkedinAutoSync, setLinkedinAutoSync] = useState(initialConfig?.autoSyncLinkedIn ?? true);
  const [emailInterval, setEmailInterval] = useState(initialConfig?.autoSyncIntervalEmail ?? 30);
  const [linkedinInterval, setLinkedinInterval] = useState(initialConfig?.autoSyncIntervalLinkedIn ?? 60);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await saveAutopilotConfigAction(
      emailAutoSync,
      linkedinAutoSync,
      emailInterval,
      linkedinInterval
    );

    setSaving(false);
    if (res.success) {
      setMessage({ type: "success", text: "Autopilot settings saved successfully!" });
      router.refresh();
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: "error", text: res.message || "Failed to save settings." });
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg text-sm border ${
          message.type === "success" 
            ? "bg-primary/10 border-primary/20 text-primary" 
            : "bg-destructive/10 border-destructive/20 text-destructive"
        }`}>
          {message.text}
        </div>
      )}

      {/* Email Card */}
      <div className={`glass-panel rounded-2xl p-6 transition-all duration-300 ${emailAutoSync ? "border-primary/20 shadow-glow" : "border-white/5"}`}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${emailAutoSync ? "bg-primary/10 text-primary border border-primary/20" : "bg-white/5 text-muted-foreground border border-white/5"}`}>
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground mb-0.5">Email Inbox Sync</h2>
              <p className="text-xs text-muted-foreground">Automatically fetch and triage your IMAP emails.</p>
            </div>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={emailAutoSync}
              onChange={(e) => setEmailAutoSync(e.target.checked)}
            />
            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
          </label>
        </div>

        <div className={`transition-all duration-300 overflow-hidden ${emailAutoSync ? "max-h-40 opacity-100" : "max-h-0 opacity-0 pointer-events-none"}`}>
          <div className="pt-4 border-t border-white/5">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Sync Interval
                </label>
                <span className="text-xs font-bold bg-[#050505] px-2.5 py-1 rounded-md border border-white/5 text-primary">
                  {emailInterval} minutes
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  min="30" 
                  max="120" 
                  step="5"
                  value={emailInterval}
                  onChange={(e) => setEmailInterval(parseInt(e.target.value))}
                  className="flex-1 accent-primary bg-white/5 rounded-lg appearance-none h-1 cursor-pointer"
                />
              </div>
              <span className="text-[10px] text-muted-foreground mt-1.5 block">
                Minimum sync interval is 30 minutes to respect provider limits.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* LinkedIn Card */}
      <div className={`glass-panel rounded-2xl p-6 transition-all duration-300 ${linkedinAutoSync ? "border-primary/20 shadow-glow" : "border-white/5"}`}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${linkedinAutoSync ? "bg-primary/10 text-primary border border-primary/20" : "bg-white/5 text-muted-foreground border border-white/5"}`}>
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground mb-0.5">LinkedIn Messages Sync</h2>
              <p className="text-xs text-muted-foreground">Automatically check and parse your LinkedIn messages.</p>
            </div>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={linkedinAutoSync}
              onChange={(e) => setLinkedinAutoSync(e.target.checked)}
            />
            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
          </label>
        </div>

        <div className={`transition-all duration-300 overflow-hidden ${linkedinAutoSync ? "max-h-40 opacity-100" : "max-h-0 opacity-0 pointer-events-none"}`}>
          <div className="pt-4 border-t border-white/5">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Sync Interval
                </label>
                <span className="text-xs font-bold bg-[#050505] px-2.5 py-1 rounded-md border border-white/5 text-primary">
                  {linkedinInterval} minutes
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  min="30" 
                  max="120" 
                  step="5"
                  value={linkedinInterval}
                  onChange={(e) => setLinkedinInterval(parseInt(e.target.value))}
                  className="flex-1 accent-primary bg-white/5 rounded-lg appearance-none h-1 cursor-pointer"
                />
              </div>
              <span className="text-[10px] text-muted-foreground mt-1.5 block">
                Minimum sync interval is 30 minutes to avoid rate limits.
              </span>
            </div>
          </div>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={saving}
        className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-lg hover:scale-[1.01] hover:shadow-glow transition-all active:scale-[0.99] text-sm flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {saving ? "Saving Changes..." : "Save Autopilot Settings"}
      </button>
    </form>
  );
}
