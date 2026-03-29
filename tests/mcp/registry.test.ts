import { describe, it, expect } from 'vitest';
import { ToolRegistry } from '../../src/mcp/registry.js';
import { McpTool } from '../../src/mcp/tool.js';

const fakeTool: McpTool = {
  name: 'test_tool',
  description: 'A test tool',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
    },
  },
  execute: async () => ({ result: 'ok' }),
};

describe('ToolRegistry', () => {
  it('registers and retrieves a tool', () => {
    const registry = new ToolRegistry();
    registry.register(fakeTool);
    expect(registry.get('test_tool')).toBe(fakeTool);
  });

  it('returns undefined for unknown tool', () => {
    const registry = new ToolRegistry();
    expect(registry.get('nope')).toBeUndefined();
  });

  it('lists all registered tools', () => {
    const registry = new ToolRegistry();
    registry.register(fakeTool);
    expect(registry.getAll()).toHaveLength(1);
    expect(registry.getAll()[0].name).toBe('test_tool');
  });

  it('generates Claude API tool format', () => {
    const registry = new ToolRegistry();
    registry.register(fakeTool);
    const claudeTools = registry.toClaudeTools();
    expect(claudeTools).toHaveLength(1);
    expect(claudeTools[0]).toEqual({
      name: 'test_tool',
      description: 'A test tool',
      input_schema: fakeTool.inputSchema,
    });
  });
});
