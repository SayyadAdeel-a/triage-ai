const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");

async function run() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@codefuturist/email-mcp", "stdio"],
    env: {
      ...process.env,
    }
  });

  const client = new Client(
    { name: "test", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log("Connected. Calling list_emails...");

  try {
    const result = await client.callTool({
      name: "list_emails",
      arguments: { account: "personal", pageSize: 5, seen: false }
    });
    console.log("RESULT:");
    console.dir(result, { depth: null });
  } catch (err) {
    console.error("TOOL ERROR:", err);
  }

  process.exit(0);
}

run();
