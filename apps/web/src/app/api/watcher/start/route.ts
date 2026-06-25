import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getMcpClient } from "@/lib/mcp-client";
import { processEmails } from "@/lib/ai-processor";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let config = await prisma.appConfig.findUnique({
      where: { userId: user.id }
    });

    if (!config?.watcherEnabled) {
      // Auto-enable for prototyping
      config = await prisma.appConfig.update({
        where: { userId: user.id },
        data: { watcherEnabled: true }
      });
    }

    // Get the client with enableWatcher = true to generate the TOML properly
    // This will reuse the singleton pooled client in mcp-client.ts
    const { client } = await getMcpClient(user.id, true);
    
    console.log(`Starting IMAP IDLE watcher for user ${user.id}...`);

    // Standard MCP notification handler
    client.fallbackNotificationHandler = async (notification) => {
      console.log("Watcher received MCP notification:", notification);
      if (notification.method === "notifications/message" || notification.method === "notify") {
        console.log("New email detected by watcher! Triggering pipeline...");
        await processEmails(user.id);
      }
    };

    return NextResponse.json({ status: "Watcher started" });
  } catch (error: any) {
    console.error("Watcher start failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
