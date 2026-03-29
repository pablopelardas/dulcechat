import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ToolRegistry } from './registry.js';
import { ApiClient } from './api-client.js';
import { ordersTool } from './tools/orders.js';
import { stockTool } from './tools/stock.js';
import { customersTool } from './tools/customers.js';

const apiUrl = process.env.DULCEGESTION_API_URL ?? 'http://localhost:3001/api';
const authToken = process.env.DULCEGESTION_AUTH_TOKEN ?? '';

const api = new ApiClient(apiUrl);
const registry = new ToolRegistry();
registry.register(ordersTool(api));
registry.register(stockTool(api));
registry.register(customersTool(api));

const server = new McpServer({
  name: 'dulcegestion',
  version: '1.0.0',
});

for (const tool of registry.getAll()) {
  server.tool(
    tool.name,
    tool.description,
    tool.inputSchema as any,
    async (params: Record<string, unknown>) => {
      const result = await tool.execute(params, authToken);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[mcp] DulceGestion MCP server running on stdio');
}

main().catch(console.error);
