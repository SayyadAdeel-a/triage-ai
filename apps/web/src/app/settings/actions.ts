"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveAppConfig(formData: FormData) {
  const imapEmail = formData.get("imapEmail") as string;
  const imapPassword = formData.get("imapPassword") as string;

  await prisma.appConfig.upsert({
    where: { id: "default" },
    update: {
      imapEmail,
      imapPassword: imapPassword || null, // Keep existing if blank in UI? Let's just overwrite for now.
    },
    create: {
      id: "default",
      imapEmail,
      imapPassword,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/");
}
