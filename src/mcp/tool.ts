export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute(params: Record<string, unknown>, authToken: string): Promise<unknown>;
}
