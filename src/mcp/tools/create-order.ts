import { McpTool } from '../tool.js';
import { ApiClient } from '../api-client.js';

interface OrderItem {
  quantity: number;
  price: number;
  product?: { name: string } | null;
  recipe?: { name: string } | null;
}

interface RawOrder {
  id: number;
  orderNumber: string;
  customer?: { name: string } | null;
  status: string;
  items: OrderItem[];
  adjustment?: number;
}

export function createOrderTool(api: ApiClient): McpTool {
  return {
    name: 'crear_pedido',
    description: 'Crear un pedido. Requiere customerId, fecha de entrega e items con recipeId o productId, cantidad y precio.',
    inputSchema: {
      type: 'object',
      properties: {
        customerId: { type: 'number', description: 'ID del cliente' },
        delivery_date: { type: 'string', description: 'Fecha de entrega (YYYY-MM-DD)' },
        items: {
          type: 'array',
          description: 'Items del pedido',
          items: {
            type: 'object',
            properties: {
              recipeId: { type: 'number', description: 'ID de receta (o productId)' },
              productId: { type: 'number', description: 'ID de producto (o recipeId)' },
              quantity: { type: 'number', description: 'Cantidad' },
              price: { type: 'number', description: 'Precio unitario' },
            },
          },
        },
        notes: { type: 'string', description: 'Notas del pedido' },
        discount_code: { type: 'string', description: 'Codigo de descuento' },
      },
      required: ['customerId', 'items', 'delivery_date'],
    },
    async execute(params, authToken) {
      const body: Record<string, unknown> = {
        customerId: params.customerId,
        delivery_date: params.delivery_date,
        items: params.items,
      };
      if (params.notes) body.notes = params.notes;
      if (params.discount_code) body.discount_code = params.discount_code;

      const result = await api.post('/orders', body, authToken);

      if (!result.ok) return { error: result.error };

      const order = result.data as RawOrder;
      const itemsTotal = order.items.reduce((sum, i) => sum + i.quantity * i.price, 0);
      const total = itemsTotal + (order.adjustment ?? 0);

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.customer?.name ?? 'Sin cliente',
        status: order.status,
        total,
      };
    },
  };
}
