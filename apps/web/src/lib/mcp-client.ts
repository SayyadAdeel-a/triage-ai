import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { prisma } from "@/lib/prisma";

export async function getMcpClient() {
  console.log("Connecting to Email MCP Server...");

  const config = await prisma.appConfig.findUnique({
    where: { id: "default" }
  });

  if (!config || !config.imapEmail || !config.imapPassword) {
    throw new Error("IMAP configuration is missing. Please go to Settings to connect your inbox.");
  }

  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@codefuturist/email-mcp", "stdio"],
    env: {
      ...process.env,
      MCP_EMAIL_ADDRESS: config.imapEmail,
      MCP_EMAIL_PASSWORD: config.imapPassword
    }
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
