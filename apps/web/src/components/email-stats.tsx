"use client";

import { useEffect, useState } from "react";
import { getEmailStatsAction } from "@/app/actions";
import { Loader2, TrendingUp, Mail, User, BarChart, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";

export function EmailStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEmailStatsAction().then(res => {
      if (res.success && res.stats) {
        setStats(res.stats);
      } else {
        setError(res.message || "Failed to load stats");
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <Card className="glass border-white/10 p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground font-semibold">Loading Email Analytics...</span>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass border-white/10 p-6 flex items-center gap-3 text-red-400">
        <Activity className="w-5 h-5" />
        <p className="font-semibold">{error}</p>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-2 mb-4">
        <BarChart className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold text-white tracking-tight">Analytics Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass border-white/10 p-5 shadow-glow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Mail className="w-12 h-12" />
          </div>
          <p className="text-sm text-muted-foreground font-semibold mb-1">Total Volume (7d)</p>
          <p className="text-3xl font-bold text-white">{stats.totalEmails || stats.total || 0}</p>
        </Card>

        <Card className="glass border-white/10 p-5 shadow-glow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-12 h-12 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground font-semibold mb-1">Unread</p>
          <p className="text-3xl font-bold text-primary">{stats.unreadCount || stats.unread || 0}</p>
        </Card>
      </div>

      {stats.topSenders && stats.topSenders.length > 0 && (
        <Card className="glass border-white/10 p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Top Senders
          </h3>
          <div className="space-y-3">
            {stats.topSenders.slice(0, 5).map((sender: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground truncate pr-4">{sender.sender || sender.email || sender.name || sender}</span>
                <span className="text-sm font-bold text-white bg-white/5 px-2 py-0.5 rounded-md">{sender.count || 0}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Generic fallback renderer for unknown data shapes */}
      {(!stats.topSenders && Object.keys(stats).length > 0) && (
        <Card className="glass border-white/10 p-6">
           <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Raw Insights
          </h3>
          <pre className="text-xs text-muted-foreground overflow-x-auto">
            {JSON.stringify(stats, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}
