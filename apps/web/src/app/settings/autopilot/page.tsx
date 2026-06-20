import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AutopilotForm } from "./autopilot-form";
import { Zap } from "lucide-react";

export default async function AutoPilotSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const config = await prisma.appConfig.findUnique({
    where: { userId: user.id },
  });

  return (
    <div className="max-w-2xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-glow">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Autopilot Settings</h1>
      </div>
      <p className="text-muted-foreground mb-8 text-sm">
        Configure how frequently the AI automatically fetches and triages your inbox in the background.
      </p>

      <AutopilotForm initialConfig={config} />
    </div>
  );
}
