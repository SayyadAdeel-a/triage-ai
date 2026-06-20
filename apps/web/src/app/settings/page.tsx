import { prisma } from "@/lib/prisma";
import { saveAppConfig } from "./actions";
import { LinkedInConnectButton } from "./linkedin-connect-button";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const config = await prisma.appConfig.findUnique({
    where: { userId: user.id },
  });

  return (
    <div className="max-w-2xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Settings</h1>
      <p className="text-muted-foreground mb-8 text-sm">
        Manage your local inbox credentials and application preferences.
      </p>

      <form action={saveAppConfig} className="bg-card/50 backdrop-blur-md border border-border rounded-2xl p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-foreground mb-6">Inbox Connection</h2>
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
            <input 
              type="email" 
              name="imapEmail" 
              defaultValue={config?.imapEmail || ""}
              placeholder="you@gmail.com"
              className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm" 
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">App Password</label>
            <input 
              type="password" 
              name="imapPassword" 
              defaultValue={config?.imapPassword || ""}
              placeholder="16-character App Password"
              className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm" 
              required 
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              For security, do not use your normal account password. Generate an "App Password" in your email provider's security settings.
            </p>
          </div>

          <div className="space-y-2 pt-4 border-t border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">LinkedIn Profile</h3>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Full Name (As it appears on LinkedIn)</label>
            <input 
              type="text" 
              name="linkedInName" 
              defaultValue={config?.linkedInName || ""}
              placeholder="e.g. John Doe"
              className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm" 
              required 
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Required so the AI can distinguish your messages from incoming messages.
            </p>
          </div>

          <button 
            type="submit" 
            className="w-full mt-4 bg-primary text-primary-foreground font-semibold py-2.5 rounded-lg hover:scale-[1.02] hover:shadow-glow transition-all active:scale-[0.98] text-sm"
          >
            Save Credentials
          </button>
        </div>
      </form>

      <LinkedInConnectButton isConnected={config?.linkedInConnected ?? false} />
    </div>
  );
}
