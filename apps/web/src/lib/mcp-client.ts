import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function getMcpClient(userId: string) {
  console.log("Connecting to Email MCP Server...");

  const config = await prisma.appConfig.findUnique({
    where: { userId }
  });

  if (!config || !config.imapEmail || !config.imapPassword) {
    throw new Error("IMAP configuration is missing. Please go to Settings to connect your inbox.");
  }

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
  
  return {
    client,
    close: () => {
      try {
        if (typeof (transport as any).close === 'function') {
          (transport as any).close();
        }
      } catch (e) {
        // ignore
      }
    }
  };
}
