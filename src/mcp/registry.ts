import { McpTool } from './tool.js';

export class ToolRegistry {
  private tools = new Map<string, McpTool>();

  register(tool: McpTool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): McpTool | undefined {
    return this.tools.get(name);
  }

  getAll(): McpTool[] {
    return Array.from(this.tools.values());
  }

  toClaudeTools(): { name: string; description: string; input_schema: Record<string, unknown> }[] {
    return this.getAll().map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema,
    }));
  }
}
