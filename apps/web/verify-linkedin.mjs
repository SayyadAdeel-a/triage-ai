import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function verify() {
  console.log("Starting MCP Client...");
  const transport = new StdioClientTransport({
    command: "uvx",
    args: ["mcp-server-linkedin@latest"],
    env: { ...process.env, UV_HTTP_TIMEOUT: "300" }
  });

  const client = new Client(
    {
      name: "verify-script",
      version: "1.0.0",
    },
    { capabilities: {} }
  );

  console.log("Connecting...");
  await client.connect(transport);
  
  console.log("Calling get_my_profile...");
  try {
    const result = await client.callTool({
      name: "get_my_profile",
      arguments: {}
    });
    console.log("Success! LinkedIn is connected. Data:");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Failed to fetch profile:");
    console.error(err);
  }
  
  process.exit(0);
}

verify();
