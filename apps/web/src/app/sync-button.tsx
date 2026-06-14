"use client";

import { Button } from "@/components/ui/button";
import { useTransition, useState } from "react";
import { syncEmailsAction } from "./actions";

export function SyncButton() {
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
    <div className="flex flex-col items-end">
      <Button 
        onClick={handleSync}
        disabled={isPending}
        className="bg-black hover:bg-gray-800 text-white rounded-full px-6 shadow-md transition-transform hover:scale-105"
      >
        {isPending ? "Syncing..." : "Sync Emails via MCP"}
      </Button>
      {status && <p className="text-xs text-gray-500 mt-2">{status}</p>}
    </div>
  );
}
