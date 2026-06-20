"use client";

import { Button } from "@/components/ui/button";
import { useTransition, useState } from "react";
import { syncEmailsAction } from "./actions";

export function SyncButton({ inline = false }: { inline?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  const handleSync = () => {
    setStatus("Syncing...");
    startTransition(async () => {
      try {
        const res = await syncEmailsAction();
        setStatus(res.message);
      } catch (e) {
        setStatus("Error syncing emails.");
      }
      setTimeout(() => setStatus(null), 3000);
    });
  };

  return (
    <div className={inline ? "flex items-center" : "flex flex-col w-full"}>
      <Button 
        onClick={handleSync}
        disabled={isPending}
        variant={inline ? "outline" : "default"}
        size={inline ? "sm" : "default"}
        className={inline ? "gap-2" : "w-full gap-2 transition-transform hover:scale-[1.02]"}
      >
        {isPending ? "Syncing..." : "Sync Emails via MCP"}
      </Button>
      {!inline && status && <p className="text-xs text-muted-foreground mt-2 text-center">{status}</p>}
    </div>
  );
}
