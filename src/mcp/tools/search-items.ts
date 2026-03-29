import { McpTool } from '../tool.js';
import { ApiClient } from '../api-client.js';

interface SearchItem {
  id: number;
  type: 'recipe' | 'product';
  name: string;
  price: number;
}

interface SearchResult {
  items: SearchItem[];
  priceRounding: number;
}

export function searchItemsTool(api: ApiClient): McpTool {
  return {
    name: 'buscar_items',
    description: 'Buscar recetas y productos por nombre. Devuelve id, tipo, nombre y precio.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Nombre del producto o receta a buscar' },
      },
      required: ['query'],
    },
    async execute(params, authToken) {
      const q = encodeURIComponent(String(params.query));
      const result = await api.fetch(`/bot/search-items?q=${q}`, authToken);

      if (!result.ok) return { error: result.error };

      const data = result.data as SearchResult;
      return {
        items: data.items,
        priceRounding: data.priceRounding,
      };
    },
  };
}
