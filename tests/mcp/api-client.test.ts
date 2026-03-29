import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClient } from '../../src/mcp/api-client.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('ApiClient', () => {
  const client = new ApiClient('http://localhost:3001/api');

  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('calls API with auth header and returns data', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ id: 1 }],
    });

    const result = await client.fetch('/orders', 'my-token');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/orders',
      { headers: { Authorization: 'Bearer my-token' } },
    );
    expect(result).toEqual({ ok: true, data: [{ id: 1 }] });
  });

  it('returns error when no auth token', async () => {
    const result = await client.fetch('/orders', '');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('autenticado');
  });

  it('returns error on HTTP failure', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401, statusText: 'Unauthorized' });
    const result = await client.fetch('/orders', 'bad-token');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('401');
  });

  it('sends POST with JSON body and auth header', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, name: 'Test' }),
    });

    const result = await client.post('/customers', { name: 'Test' }, 'my-token');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/customers',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer my-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Test' }),
      },
    );
    expect(result).toEqual({ ok: true, data: { id: 1, name: 'Test' } });
  });

  it('returns error on POST without auth token', async () => {
    const result = await client.post('/customers', { name: 'Test' }, '');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('autenticado');
  });

  it('returns error on POST HTTP failure', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 400, statusText: 'Bad Request' });
    const result = await client.post('/orders', { items: [] }, 'token');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('400');
  });
});
