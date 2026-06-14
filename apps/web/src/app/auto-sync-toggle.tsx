"use client";

import { useState, useEffect } from "react";
import { syncEmailsAction } from "./actions";
import { useRouter } from "next/navigation";

export function AutoSyncToggle() {
  const [autoSync, setAutoSync] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const router = useRouter();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoSync) {
      // 30 minutes in ms
      const intervalMs = 30 * 60 * 1000;
      
      const performSync = async () => {
        setSyncing(true);
        try {
          const res = await syncEmailsAction();
          setLastSync(new Date());
          if (res.success) {
            router.refresh(); // Soft refresh to load new emails without taking over screen
          }
        } catch (e) {
          console.error("Auto-sync failed:", e);
        }
        setSyncing(false);
      };

      // Perform an initial sync right when toggled on
      performSync();
      
      interval = setInterval(performSync, intervalMs);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoSync, router]);

  return (
    <div className="flex items-center gap-3 bg-white border px-3 py-2 rounded-lg shadow-sm">
      <div className="flex items-center gap-2">
        <div 
          className={`w-10 h-5 rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${autoSync ? 'bg-green-500' : 'bg-gray-300'}`}
          onClick={() => setAutoSync(!autoSync)}
        >
          <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${autoSync ? 'translate-x-4.5' : 'translate-x-0'}`} style={{ transform: autoSync ? 'translateX(18px)' : 'translateX(0)' }}></div>
        </div>
        <span className="text-sm font-medium text-gray-700">Auto-Pilot</span>
      </div>
      
      {autoSync && (
        <div className="text-xs text-gray-500 border-l pl-3 flex items-center gap-1.5">
          {syncing ? (
            <>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Syncing...</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Active (30m)</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
