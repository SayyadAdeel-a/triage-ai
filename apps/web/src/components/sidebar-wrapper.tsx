import { Sidebar } from "./sidebar";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function SidebarWrapper() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null; // Don't show sidebar if not logged in
  }

  const config = await prisma.appConfig.findUnique({
    where: { userId: user.id }
  });

  const isEmailConnected = !!config?.imapEmail;
  const isLinkedInConnected = !!config?.linkedInConnected;

  return (
    <Sidebar 
      isEmailConnected={isEmailConnected} 
      isLinkedInConnected={isLinkedInConnected} 
    />
  );
}
