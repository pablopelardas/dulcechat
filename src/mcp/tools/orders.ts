import { McpTool } from '../tool.js';
import { ApiClient } from '../api-client.js';

interface RawOrder {
  id: number;
  status: string;
  delivery_date: string;
  customer?: { name: string };
  total?: number;
}

export function ordersTool(api: ApiClient): McpTool {
  return {
    name: 'ver_pedidos',
    description: 'Consultar pedidos del negocio. Puede filtrar por fecha (YYYY-MM-DD) y estado (pending, delivered, cancelled).',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Estado: pending, delivered, cancelled' },
        startDate: { type: 'string', description: 'Fecha inicio ISO (YYYY-MM-DD)' },
        endDate: { type: 'string', description: 'Fecha fin ISO (YYYY-MM-DD)' },
      },
    },
    async execute(params, authToken) {
      const query = new URLSearchParams();
      if (params.status) query.set('status', String(params.status));
      if (params.startDate) query.set('startDate', String(params.startDate));
      if (params.endDate) query.set('endDate', String(params.endDate));

      const qs = query.toString();
      const result = await api.fetch(`/orders${qs ? `?${qs}` : ''}`, authToken);

      if (!result.ok) return { error: result.error };

      const orders = result.data as RawOrder[];
      return {
        count: orders.length,
        orders: orders.slice(0, 15).map((o) => ({
          id: o.id,
          customer: o.customer?.name ?? 'Sin cliente',
          status: o.status,
          date: new Date(o.delivery_date).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }),
          total: o.total,
        })),
      };
    },
  };
}
