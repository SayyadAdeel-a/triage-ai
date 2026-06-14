"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { loadDemoInboxAction } from "./actions";

export function DemoInboxButton() {
  const [loading, setLoading] = useState(false);

  const handleLoadDemo = async () => {
    setLoading(true);
    await loadDemoInboxAction();
    setLoading(false);
  };

  return (
    <Button 
      onClick={handleLoadDemo} 
      disabled={loading} 
      variant="outline" 
      className="mt-4 border-dashed border-2 bg-blue-50 text-blue-700 hover:bg-blue-100"
    >
      {loading ? "Injecting Demo Data..." : "Load Demo Inbox (Fake Data)"}
    </Button>
  );
}
