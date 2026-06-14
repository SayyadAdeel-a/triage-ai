"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { generateDailyBriefingAction } from "./actions";

export function MorningBriefingBanner() {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const res = await generateDailyBriefingAction();
    if (res.success && res.briefing) {
      setBriefing(res.briefing);
    } else {
      setBriefing("Could not generate briefing. Not enough emails synced.");
    }
    setLoading(false);
  };

  if (briefing) {
    return (
      <div className="w-full bg-blue-900 text-white p-4 rounded-xl shadow-md mb-6 relative">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-bold text-blue-200 text-sm tracking-widest uppercase mb-1">Morning Briefing</h3>
            <p className="text-sm leading-relaxed">{briefing}</p>
          </div>
          <button 
            onClick={() => setBriefing(null)}
            className="text-blue-300 hover:text-white ml-4"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <Button 
      onClick={handleGenerate} 
      disabled={loading} 
      className="mb-6 w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
    >
      {loading ? "Generating Morning Briefing..." : "Generate Morning Briefing ✨"}
    </Button>
  );
}
