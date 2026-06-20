"use client";

import { useState } from "react";
import { connectLinkedInAction, disconnectLinkedInAction, verifyLinkedInConnectionAction } from "@/app/actions";
import { Briefcase, LogOut, Loader2, CheckCircle } from "lucide-react";

export function LinkedInConnectButton({ isConnected }: { isConnected: boolean }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await connectLinkedInAction();
      if (result.message) {
        setMessage(result.message);
      }
    } catch (e: any) {
      setMessage(e.message || "Connection failed");
    }
    setLoading(false);
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await disconnectLinkedInAction();
    } catch (e: any) {
      setMessage(e.message || "Disconnect failed");
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await verifyLinkedInConnectionAction();
      if (result.message) {
        setMessage(result.message);
      }
    } catch (e: any) {
      setMessage(e.message || "Verification failed");
    }
    setLoading(false);
  };

  return (
    <div className="bg-card/50 backdrop-blur-md border border-border rounded-2xl p-8 shadow-sm mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#0A66C2]" />
            LinkedIn Connection
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Connect your LinkedIn account to allow the AI to sync and triage your messages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-green-500 shadow-[0_0_8px_#10b981]" : "bg-red-500"}`} />
          <span className="text-sm font-medium">{isConnected ? "Connected" : "Not Connected"}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {!isConnected ? (
          <button 
            onClick={handleConnect}
            disabled={loading}
            className="flex-1 bg-[#0A66C2] text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-[#004182] hover:scale-[1.02] hover:shadow-glow transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Briefcase className="w-4 h-4" />}
            {loading ? "Waiting for Login..." : "Connect to LinkedIn"}
          </button>
        ) : (
          <div className="flex gap-4 w-full flex-col sm:flex-row">
            <button 
              onClick={handleVerify}
              disabled={loading}
              className="flex-1 bg-secondary text-secondary-foreground font-semibold py-2.5 px-4 rounded-lg hover:bg-secondary/80 transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Verify Connection
            </button>
            <button 
              onClick={handleDisconnect}
              disabled={loading}
              className="flex-1 bg-destructive/10 text-destructive font-semibold py-2.5 px-4 rounded-lg hover:bg-destructive/20 transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              Disconnect
            </button>
          </div>
        )}
      </div>
      {!isConnected ? (
        <p className="text-[11px] text-muted-foreground mt-4">
          Clicking "Connect" will attempt to verify your session. If not logged in, a Chromium window will temporarily open.
        </p>
      ) : (
        <p className="text-[11px] text-muted-foreground mt-4">
          If you are experiencing issues, you can click "Verify Connection" to test the integration.
        </p>
      )}
      {message && (
        <p className="text-[11px] text-muted-foreground mt-2 px-1">{message}</p>
      )}
    </div>
  );
}
