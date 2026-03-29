import { McpTool } from '../tool.js';
import { ApiClient } from '../api-client.js';

interface RawIngredient {
  name: string;
  stock: number;
  unit: string;
  stock_threshold?: number | null;
}

export function stockTool(api: ApiClient): McpTool {
  return {
    name: 'ver_stock',
    description: 'Ver stock actual de ingredientes y detectar faltantes.',
    inputSchema: { type: 'object', properties: {} },
    async execute(_params, authToken) {
      const result = await api.fetch('/ingredients', authToken);

      if (!result.ok) return { error: result.error };

      const ingredients = result.data as RawIngredient[];
      const lowStock = ingredients.filter((i) => i.stock_threshold != null && i.stock <= i.stock_threshold);

      return {
        total: ingredients.length,
        lowStock: lowStock.map((i) => ({ name: i.name, stock: i.stock, unit: i.unit, threshold: i.stock_threshold })),
        ingredients: ingredients.slice(0, 15).map((i) => ({ name: i.name, stock: i.stock, unit: i.unit })),
      };
    },
  };
}
