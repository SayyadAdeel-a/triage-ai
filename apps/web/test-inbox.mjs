import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  console.log("Starting MCP Client...");
  
  const transport = new StdioClientTransport({
    command: "uvx",
    args: ["mcp-server-linkedin@latest"]
  });
  
  const client = new Client({ name: "linkedin-test", version: "1.0.0" }, { capabilities: {} });
  await client.connect(transport);
  console.log("Connected. Fetching inbox...");
  
  const result = await client.callTool({
    name: "get_inbox",
    arguments: { limit: 2 }
  });
  
  console.log("Result:");
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

main().catch(console.error);
