import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export async function getMcpClient() {
  console.log("Connecting to Email MCP Server...");
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
