import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchItemsTool } from '../../../src/mcp/tools/search-items.js';
import { ApiClient } from '../../../src/mcp/api-client.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('searchItemsTool', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('has correct name and schema', () => {
    const client = new ApiClient('http://localhost:3001/api');
    const tool = searchItemsTool(client);
    expect(tool.name).toBe('buscar_items');
    expect(tool.inputSchema.properties).toHaveProperty('query');
  });

  it('calls bot/search-items endpoint with query', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          { id: 5, type: 'product', name: 'Torta Brownie 20p', price: 15000 },
          { id: 3, type: 'recipe', name: 'Torta Brownie 10p', price: 8500 },
        ],
        priceRounding: 50,
      }),
    });

    const client = new ApiClient('http://localhost:3001/api');
    const tool = searchItemsTool(client);
    const result = await tool.execute({ query: 'torta brownie' }, 'token');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/bot/search-items?q=torta%20brownie',
      expect.objectContaining({ headers: { Authorization: 'Bearer token' } }),
    );
    expect(result).toEqual({
      items: [
        { id: 5, type: 'product', name: 'Torta Brownie 20p', price: 15000 },
        { id: 3, type: 'recipe', name: 'Torta Brownie 10p', price: 8500 },
      ],
      priceRounding: 50,
    });
  });

  it('returns error when not authenticated', async () => {
    const client = new ApiClient('http://localhost:3001/api');
    const tool = searchItemsTool(client);
    const result = await tool.execute({ query: 'torta' }, '');
    expect(result).toHaveProperty('error');
  });
});
