import { createLinkedInMcpClient } from './src/lib/linkedin-mcp-client.js';

async function main() {
  const { client, transport } = await createLinkedInMcpClient();
  const tools = await client.listTools();
  console.log(JSON.stringify(tools, null, 2));
  transport.close();
}

main().catch(console.error);
