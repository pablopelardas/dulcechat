import { McpTool } from '../tool.js';
import { ApiClient } from '../api-client.js';

interface RawCustomer {
  id: number;
  name: string;
  phone: string | null;
  balance?: number;
}

export function customersTool(api: ApiClient): McpTool {
  return {
    name: 'ver_clientes',
    description: 'Buscar y listar clientes del negocio. Puede filtrar por nombre.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Nombre del cliente a buscar' },
      },
    },
    async execute(params, authToken) {
      const qs = new URLSearchParams({ _include: 'balance' });
      if (params.query) qs.set('q', String(params.query));

      const result = await api.fetch(`/customers?${qs.toString()}`, authToken);

      if (!result.ok) return { error: result.error };

      const customers = result.data as RawCustomer[];
      return {
        total: customers.length,
        customers: customers.slice(0, 10).map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          balance: c.balance ?? 0,
        })),
      };
    },
  };
}
