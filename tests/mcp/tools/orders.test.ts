import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ordersTool } from '../../../src/mcp/tools/orders.js';
import { ApiClient } from '../../../src/mcp/api-client.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('ordersTool', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('has correct name and schema', () => {
    const client = new ApiClient('http://localhost:3001/api');
    const tool = ordersTool(client);
    expect(tool.name).toBe('ver_pedidos');
    expect(tool.inputSchema.properties).toHaveProperty('status');
    expect(tool.inputSchema.properties).toHaveProperty('startDate');
    expect(tool.inputSchema.properties).toHaveProperty('endDate');
  });

  it('returns compact order data', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 44, status: 'pending', delivery_date: '2026-04-02T15:00:00Z', customer: { name: 'Camila' }, total: 5000 },
      ],
    });

    const client = new ApiClient('http://localhost:3001/api');
    const tool = ordersTool(client);
    const result = await tool.execute({ startDate: '2026-04-01', endDate: '2026-04-07' }, 'token');

    expect(result).toEqual({
      count: 1,
      orders: [{ id: 44, customer: 'Camila', status: 'pending', date: expect.any(String), total: 5000 }],
    });
  });

  it('returns error object when not authenticated', async () => {
    const client = new ApiClient('http://localhost:3001/api');
    const tool = ordersTool(client);
    const result = await tool.execute({}, '');
    expect(result).toHaveProperty('error');
  });
});
