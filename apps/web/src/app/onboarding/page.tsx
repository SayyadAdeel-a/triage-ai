import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "./wizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const config = await prisma.appConfig.findUnique({ where: { userId: user.id } });
  
  // If they already have either connection, send them to the dashboard
  if (config?.imapEmail || config?.linkedInConnected) {
    redirect("/");
  }

  return <OnboardingWizard />;
}
