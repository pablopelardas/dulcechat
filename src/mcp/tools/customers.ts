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
    description: 'Buscar y listar clientes del negocio con saldo pendiente.',
    inputSchema: { type: 'object', properties: {} },
    async execute(_params, authToken) {
      const result = await api.fetch('/customers?_include=balance', authToken);

      if (!result.ok) return { error: result.error };

      const customers = result.data as RawCustomer[];
      return {
        total: customers.length,
        customers: customers.slice(0, 10).map((c) => ({
          name: c.name,
          phone: c.phone,
          balance: c.balance ?? 0,
        })),
      };
    },
  };
}
