import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export async function createLinkedInMcpClient() {
  const transport = new StdioClientTransport({
    command: "uvx",
    args: ["mcp-server-linkedin@latest"],
    env: { ...process.env, UV_HTTP_TIMEOUT: "300" }
  });

  const client = new Client(
    {
      name: "triage-ai-linkedin",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);
  return { client, transport };
}
