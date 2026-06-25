import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

// Singleton map to hold pooled clients per user
const globalMcpClients = new Map<string, { client: Client, closeRaw: () => void }>();

export async function getMcpClient(userId: string, enableWatcher: boolean = false) {
  // If we already have a pooled client, return it
  if (globalMcpClients.has(userId)) {
    console.log(`Reusing pooled MCP client for user ${userId}`);
    const pooled = globalMcpClients.get(userId)!;
    return {
      client: pooled.client,
      close: () => { /* No-op to keep it pooled */ }
    };
  }

  console.log(`Spawning new Email MCP Server for user ${userId}...`);

  const config = await prisma.appConfig.findUnique({
    where: { userId }
  });

  if (!config || !config.imapEmail || !config.imapPassword) {
    throw new Error("IMAP configuration is missing. Please go to Settings to connect your inbox.");
  }

  // If the user has watcher enabled in settings, always enable it for the singleton
  const useWatcher = enableWatcher || config.watcherEnabled;

  // Generate a strict config in the global directory where the tool expects it
  const tomlContent = `
[[accounts]]
name = "default"
email = "${config.imapEmail}"
username = "${config.imapEmail}"
password = "${config.imapPassword}"

[accounts.imap]
host = "imap.gmail.com"
port = 993
tls = true
verify_ssl = true

[accounts.smtp]
host = "smtp.gmail.com"
port = 465
tls = true
verify_ssl = true
${useWatcher ? `
[settings.watcher]
enabled = true
folders = ["INBOX"]
idle_timeout = 1740

[settings.hooks]
on_new_email = "notify"
` : ""}
`;

  const os = require('os');
  const configDir = path.join(os.homedir(), '.config', 'email-mcp');
  fs.mkdirSync(configDir, { recursive: true });
  const configPath = path.join(configDir, 'config.toml');
  fs.writeFileSync(configPath, tomlContent);

  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@codefuturist/email-mcp", "stdio"]
  });

  const client = new Client(
    { name: "triage-ai-client", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log("Connected to MCP.");
  
  const closeRaw = () => {
    try {
      if (typeof (transport as any).close === 'function') {
        (transport as any).close();
      }
      globalMcpClients.delete(userId);
    } catch (e) {
      // ignore
    }
  };

  // Cache it
  globalMcpClients.set(userId, { client, closeRaw });

  return {
    client,
    // Return a dummy close function so consuming code doesn't break the pool
    close: () => { /* No-op */ }
  };
}

// Optional helper to force close a connection if needed
export function forceCloseMcpClient(userId: string) {
  const pooled = globalMcpClients.get(userId);
  if (pooled) {
    pooled.closeRaw();
  }
}
