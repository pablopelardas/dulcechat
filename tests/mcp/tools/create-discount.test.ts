import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDiscountTool } from '../../../src/mcp/tools/create-discount.js';
import { ApiClient } from '../../../src/mcp/api-client.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('createDiscountTool', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('has correct name and schema', () => {
    const client = new ApiClient('http://localhost:3001/api');
    const tool = createDiscountTool(client);
    expect(tool.name).toBe('crear_descuento');
    expect(tool.inputSchema.required).toEqual(['code', 'type', 'value']);
  });

  it('sends POST and returns compact data', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 3,
        code: 'PROMO10',
        type: 'percentage',
        value: 10,
        min_order: null,
        max_uses: null,
        current_uses: 0,
        is_active: true,
        expires_at: null,
        organizationId: 1,
        created_at: '2026-03-29T10:00:00Z',
      }),
    });

    const client = new ApiClient('http://localhost:3001/api');
    const tool = createDiscountTool(client);
    const result = await tool.execute({
      code: 'PROMO10',
      type: 'percentage',
      value: 10,
    }, 'token');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toEqual({ code: 'PROMO10', type: 'percentage', value: 10 });

    expect(result).toEqual({
      id: 3,
      code: 'PROMO10',
      type: 'percentage',
      value: 10,
    });
  });

  it('passes optional fields', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 4,
        code: 'FIJO500',
        type: 'fixed',
        value: 500,
        min_order: 3000,
        max_uses: 50,
        expires_at: '2026-12-31T23:59:59Z',
      }),
    });

    const client = new ApiClient('http://localhost:3001/api');
    const tool = createDiscountTool(client);
    await tool.execute({
      code: 'FIJO500',
      type: 'fixed',
      value: 500,
      min_order: 3000,
      max_uses: 50,
      expires_at: '2026-12-31',
    }, 'token');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.min_order).toBe(3000);
    expect(body.max_uses).toBe(50);
    expect(body.expires_at).toBe('2026-12-31');
  });

  it('returns error when not authenticated', async () => {
    const client = new ApiClient('http://localhost:3001/api');
    const tool = createDiscountTool(client);
    const result = await tool.execute({ code: 'X', type: 'fixed', value: 100 }, '');
    expect(result).toHaveProperty('error');
  });
});
