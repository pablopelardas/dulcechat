import { describe, it, expect, vi, beforeEach } from 'vitest';
import { customersTool } from '../../../src/mcp/tools/customers.js';
import { ApiClient } from '../../../src/mcp/api-client.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('customersTool', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('has correct name and schema with query param', () => {
    const client = new ApiClient('http://localhost:3001/api');
    const tool = customersTool(client);
    expect(tool.name).toBe('ver_clientes');
    expect(tool.inputSchema.properties).toHaveProperty('query');
  });

  it('passes q= param when query is provided', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 1, name: 'Maria Lopez', phone: '1155443322', balance: 0 },
      ],
    });

    const client = new ApiClient('http://localhost:3001/api');
    const tool = customersTool(client);
    await tool.execute({ query: 'Maria' }, 'token');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/customers?_include=balance&q=Maria',
      expect.objectContaining({ headers: { Authorization: 'Bearer token' } }),
    );
  });

  it('omits q= param when query is not provided', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    const client = new ApiClient('http://localhost:3001/api');
    const tool = customersTool(client);
    await tool.execute({}, 'token');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/customers?_include=balance',
      expect.objectContaining({ headers: { Authorization: 'Bearer token' } }),
    );
  });

  it('returns compact customer data with id', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 1, name: 'Maria Lopez', phone: '1155443322', balance: 500 },
        { id: 2, name: 'Maria Garcia', phone: null, balance: 0 },
      ],
    });

    const client = new ApiClient('http://localhost:3001/api');
    const tool = customersTool(client);
    const result = await tool.execute({ query: 'Maria' }, 'token');

    expect(result).toEqual({
      total: 2,
      customers: [
        { id: 1, name: 'Maria Lopez', phone: '1155443322', balance: 500 },
        { id: 2, name: 'Maria Garcia', phone: null, balance: 0 },
      ],
    });
  });
});
