"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ratelimit } from "@/lib/ratelimit";

async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

async function checkRateLimit(userId: string, actionName: string) {
  const { success } = await ratelimit.limit(`rl:${actionName}:${userId}`);
  if (!success) {
    throw new Error("Rate limit exceeded. Please try again later.");
  }
}

export async function saveAppConfig(formData: FormData) {
  const user = await requireAuth();
  await checkRateLimit(user.id, "saveAppConfig");

  const imapEmail = formData.get("imapEmail") as string;
  const imapPassword = formData.get("imapPassword") as string;
  const linkedInName = formData.get("linkedInName") as string;

  if (!imapEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(imapEmail)) {
    throw new Error("Invalid email format");
  }
  if (linkedInName && linkedInName.length > 100) {
    throw new Error("LinkedIn name too long");
  }

  await prisma.appConfig.upsert({
    where: { userId: user.id },
    update: {
      imapEmail,
      imapPassword: imapPassword || null,
      linkedInName: linkedInName || null,
    },
    create: {
      userId: user.id,
      imapEmail,
      imapPassword,
      linkedInName,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/");
  redirect("/");
}

export async function saveAutopilotConfigAction(
  autoSyncEmail: boolean,
  autoSyncLinkedIn: boolean,
  autoSyncIntervalEmail: number,
  autoSyncIntervalLinkedIn: number
) {
  try {
    const user = await requireAuth();
    await checkRateLimit(user.id, "saveAutopilotConfig");

    await prisma.appConfig.upsert({
      where: { userId: user.id },
      update: {
        autoSyncEmail,
        autoSyncLinkedIn,
        autoSyncIntervalEmail,
        autoSyncIntervalLinkedIn,
      },
      create: {
        userId: user.id,
        autoSyncEmail,
        autoSyncLinkedIn,
        autoSyncIntervalEmail,
        autoSyncIntervalLinkedIn,
      },
    });

    revalidatePath("/settings/autopilot");
    revalidatePath("/");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}
