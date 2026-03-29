import { McpTool } from '../tool.js';
import { ApiClient } from '../api-client.js';

interface RawCustomer {
  id: number;
  name: string;
  phone: string | null;
}

export function createCustomerTool(api: ApiClient): McpTool {
  return {
    name: 'crear_cliente',
    description: 'Crear un nuevo cliente. Requiere nombre, opcionalmente telefono, direccion y notas.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nombre del cliente' },
        phone: { type: 'string', description: 'Telefono' },
        address: { type: 'string', description: 'Direccion' },
        notes: { type: 'string', description: 'Notas internas' },
      },
      required: ['name'],
    },
    async execute(params, authToken) {
      const body: Record<string, unknown> = { name: params.name };
      if (params.phone) body.phone = params.phone;
      if (params.address) body.address = params.address;
      if (params.notes) body.notes = params.notes;

      const result = await api.post('/customers', body, authToken);

      if (!result.ok) return { error: result.error };

      const customer = result.data as RawCustomer;
      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
      };
    },
  };
}
