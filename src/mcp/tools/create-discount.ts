import { McpTool } from '../tool.js';
import { ApiClient } from '../api-client.js';

interface RawDiscount {
  id: number;
  code: string;
  type: string;
  value: number;
}

export function createDiscountTool(api: ApiClient): McpTool {
  return {
    name: 'crear_descuento',
    description: 'Crear un codigo de descuento. Tipo: "percentage" (porcentaje) o "fixed" (monto fijo).',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Codigo del descuento (ej: PROMO10)' },
        type: { type: 'string', description: 'Tipo: "percentage" o "fixed"' },
        value: { type: 'number', description: 'Valor del descuento (ej: 10 para 10% o $10)' },
        min_order: { type: 'number', description: 'Monto minimo del pedido para aplicar' },
        max_uses: { type: 'number', description: 'Maximo de usos permitidos' },
        expires_at: { type: 'string', description: 'Fecha de vencimiento (YYYY-MM-DD)' },
      },
      required: ['code', 'type', 'value'],
    },
    async execute(params, authToken) {
      const body: Record<string, unknown> = {
        code: params.code,
        type: params.type,
        value: params.value,
      };
      if (params.min_order) body.min_order = params.min_order;
      if (params.max_uses) body.max_uses = params.max_uses;
      if (params.expires_at) body.expires_at = params.expires_at;

      const result = await api.post('/discount-codes', body, authToken);

      if (!result.ok) return { error: result.error };

      const discount = result.data as RawDiscount;
      return {
        id: discount.id,
        code: discount.code,
        type: discount.type,
        value: discount.value,
      };
    },
  };
}
