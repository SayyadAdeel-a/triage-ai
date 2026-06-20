const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function run() {
  const transport = new StdioClientTransport({
    command: 'uvx',
    args: ['mcp-server-linkedin@latest']
  });

  const client = new Client({ name: 'test', version: '1.0' }, { capabilities: {} });
  await client.connect(transport);

  try {
    const res = await client.callTool({
      name: "get_conversation",
      arguments: { thread_id: "2-Y2ZlMjAxNzUtZDJmNy00ODIyLTk5ZGUtNzRjODIzOGNhOThiXzEwMA==" } 
    });
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }

  process.exit(0);
}
run();
