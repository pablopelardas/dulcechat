import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOrderTool } from '../../../src/mcp/tools/create-order.js';
import { ApiClient } from '../../../src/mcp/api-client.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('createOrderTool', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('has correct name and schema', () => {
    const client = new ApiClient('http://localhost:3001/api');
    const tool = createOrderTool(client);
    expect(tool.name).toBe('crear_pedido');
    expect(tool.inputSchema.properties).toHaveProperty('customerId');
    expect(tool.inputSchema.properties).toHaveProperty('delivery_date');
    expect(tool.inputSchema.properties).toHaveProperty('items');
    expect(tool.inputSchema.required).toEqual(['customerId', 'items', 'delivery_date']);
  });

  it('sends POST and returns compact order data', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 10,
        orderNumber: '2603-010',
        customerId: 1,
        customer: { id: 1, name: 'Maria Lopez', phone: '1155443322' },
        status: 'pending',
        delivery_date: '2026-04-05T00:00:00Z',
        items: [
          { id: 1, quantity: 2, price: 15000, product: { id: 5, name: 'Torta Brownie 20p' }, recipe: null },
        ],
        payments: [],
        notes: null,
        adjustment: 0,
        discount_code: null,
        source: 'manual',
      }),
    });

    const client = new ApiClient('http://localhost:3001/api');
    const tool = createOrderTool(client);
    const result = await tool.execute({
      customerId: 1,
      delivery_date: '2026-04-05',
      items: [{ productId: 5, quantity: 2, price: 15000 }],
    }, 'token');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/orders',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          customerId: 1,
          delivery_date: '2026-04-05',
          items: [{ productId: 5, quantity: 2, price: 15000 }],
        }),
      }),
    );

    expect(result).toEqual({
      id: 10,
      orderNumber: '2603-010',
      customer: 'Maria Lopez',
      status: 'pending',
      total: 30000,
    });
  });

  it('passes optional notes and discount_code', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 11,
        orderNumber: '2603-011',
        customer: { name: 'Juan' },
        status: 'pending',
        items: [{ quantity: 1, price: 5000 }],
        adjustment: -500,
        discount_code: 'PROMO10',
      }),
    });

    const client = new ApiClient('http://localhost:3001/api');
    const tool = createOrderTool(client);
    await tool.execute({
      customerId: 2,
      delivery_date: '2026-04-06',
      items: [{ recipeId: 3, quantity: 1, price: 5000 }],
      notes: 'Sin gluten',
      discount_code: 'PROMO10',
    }, 'token');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.notes).toBe('Sin gluten');
    expect(body.discount_code).toBe('PROMO10');
  });

  it('returns error when not authenticated', async () => {
    const client = new ApiClient('http://localhost:3001/api');
    const tool = createOrderTool(client);
    const result = await tool.execute({ customerId: 1, items: [], delivery_date: '2026-04-05' }, '');
    expect(result).toHaveProperty('error');
  });
});
