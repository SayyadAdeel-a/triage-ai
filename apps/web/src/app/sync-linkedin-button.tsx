"use client";

import { Button } from "@/components/ui/button";
import { useTransition, useState } from "react";
import { syncLinkedInAction } from "./actions";

export function SyncLinkedInButton({ inline = false }: { inline?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  const handleSync = () => {
    setStatus("Syncing LinkedIn...");
    startTransition(async () => {
      try {
        const res = await syncLinkedInAction();
        setStatus(res.message || "Sync Complete!");
      } catch (e) {
        setStatus("Error syncing LinkedIn.");
      }
      setTimeout(() => setStatus(null), 3000);
    });
  };

  return (
    <div className={inline ? "flex items-center" : "flex flex-col w-full"}>
      <Button 
        onClick={handleSync}
        disabled={isPending}
        size={inline ? "sm" : "default"}
        className={inline ? "gap-2 bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20" : "w-full gap-2 transition-transform hover:scale-[1.02] bg-[#0A66C2] text-white hover:bg-[#004182]"}
      >
        {isPending ? "Syncing LinkedIn..." : "Sync LinkedIn"}
      </Button>
      {!inline && status && <p className="text-xs text-muted-foreground mt-2 text-center">{status}</p>}
    </div>
  );
}
