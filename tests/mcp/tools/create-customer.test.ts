import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCustomerTool } from '../../../src/mcp/tools/create-customer.js';
import { ApiClient } from '../../../src/mcp/api-client.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('createCustomerTool', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('has correct name and schema', () => {
    const client = new ApiClient('http://localhost:3001/api');
    const tool = createCustomerTool(client);
    expect(tool.name).toBe('crear_cliente');
    expect(tool.inputSchema.required).toEqual(['name']);
  });

  it('sends POST and returns compact data', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 15,
        name: 'Juan Perez',
        phone: '1155443322',
        address: 'Av Corrientes 1234',
        notes: null,
        portal_token: null,
        created_at: '2026-03-29T10:00:00Z',
        organizationId: 1,
      }),
    });

    const client = new ApiClient('http://localhost:3001/api');
    const tool = createCustomerTool(client);
    const result = await tool.execute({
      name: 'Juan Perez',
      phone: '1155443322',
      address: 'Av Corrientes 1234',
    }, 'token');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toEqual({ name: 'Juan Perez', phone: '1155443322', address: 'Av Corrientes 1234' });

    expect(result).toEqual({
      id: 15,
      name: 'Juan Perez',
      phone: '1155443322',
    });
  });

  it('sends only name when optional fields are omitted', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 16, name: 'Ana', phone: null }),
    });

    const client = new ApiClient('http://localhost:3001/api');
    const tool = createCustomerTool(client);
    await tool.execute({ name: 'Ana' }, 'token');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toEqual({ name: 'Ana' });
  });

  it('returns error when not authenticated', async () => {
    const client = new ApiClient('http://localhost:3001/api');
    const tool = createCustomerTool(client);
    const result = await tool.execute({ name: 'Test' }, '');
    expect(result).toHaveProperty('error');
  });
});
