import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DulceGestionActions } from '../../src/actions/dulcegestion.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('DulceGestionActions', () => {
  const actions = new DulceGestionActions('http://localhost:3001/api');

  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('ver_pedidos calls GET /orders with auth header', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ id: 1, status: 'pending', delivery_date: '2026-03-30' }],
    });

    const action = actions.get('ver_pedidos')!;
    const result = await action.execute({}, 'test-token');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/orders'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      }),
    );
    expect(result).toContain('pedido');
  });

  it('ver_stock calls GET /ingredients with auth header', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ id: 1, name: 'Harina', stock: 5, unit: 'kg' }],
    });

    const action = actions.get('ver_stock')!;
    const result = await action.execute({}, 'test-token');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/ingredients'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      }),
    );
    expect(result).toContain('Harina');
  });

  it('ver_clientes calls GET /customers with auth header', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ id: 1, name: 'Maria Lopez', phone: '1234' }],
    });

    const action = actions.get('ver_clientes')!;
    const result = await action.execute({}, 'test-token');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/customers'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      }),
    );
    expect(result).toContain('Maria Lopez');
  });

  it('returns error message when API call fails', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401, statusText: 'Unauthorized' });

    const action = actions.get('ver_pedidos')!;
    const result = await action.execute({}, 'bad-token');

    expect(result).toContain('Error');
  });

  it('returns error message when no auth token', async () => {
    const action = actions.get('ver_pedidos')!;
    const result = await action.execute({}, '');

    expect(result).toContain('autenticado');
  });
});
