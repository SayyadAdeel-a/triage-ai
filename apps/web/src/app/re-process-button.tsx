"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { reProcessEmailsAction, reProcessLinkedInAction } from "./actions";

export function ReProcessButton() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const inboxType = searchParams.get("inbox") || "email";

  const handleReProcess = async () => {
    setLoading(true);
    const action = inboxType === "linkedin" ? reProcessLinkedInAction : reProcessEmailsAction;
    const res = await action();
    if (!res.success) {
      alert("Error: " + res.message);
    }
    setLoading(false);
  };

  return (
    <Button 
      onClick={handleReProcess} 
      disabled={loading} 
      variant="outline"
      size="sm"
      className="gap-2 h-9 w-full"
    >
      {loading ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          Processing...
        </span>
      ) : (
        "Re-evaluate All"
      )}
    </Button>
  );
}
