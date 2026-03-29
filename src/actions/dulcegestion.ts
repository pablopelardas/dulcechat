import { Action } from './action.js';

interface OrderSummary {
  id: number;
  status: string;
  delivery_date: string;
  customer?: { name: string };
  total?: number;
}

interface IngredientSummary {
  name: string;
  stock: number;
  unit: string;
  stock_threshold?: number | null;
}

interface CustomerSummary {
  id: number;
  name: string;
  phone: string | null;
}

export class DulceGestionActions {
  private actions: Map<string, Action>;

  constructor(private apiUrl: string) {
    this.actions = new Map();

    this.actions.set('ver_pedidos', {
      name: 'ver_pedidos',
      description: 'Ver pedidos del negocio. Puede filtrar por fecha y estado.',
      execute: (params, authToken) => this.getOrders(params, authToken),
    });

    this.actions.set('ver_stock', {
      name: 'ver_stock',
      description: 'Ver stock actual de ingredientes y detectar faltantes.',
      execute: (params, authToken) => this.getStock(params, authToken),
    });

    this.actions.set('ver_clientes', {
      name: 'ver_clientes',
      description: 'Buscar y listar clientes del negocio.',
      execute: (params, authToken) => this.getCustomers(params, authToken),
    });
  }

  get(name: string): Action | undefined {
    return this.actions.get(name);
  }

  getAll(): Action[] {
    return Array.from(this.actions.values());
  }

  private async apiFetch(path: string, authToken: string): Promise<{ ok: boolean; data?: unknown; error?: string }> {
    if (!authToken) {
      return { ok: false, error: 'No estas autenticado. Inicia sesion en DulceGestion para consultar datos.' };
    }

    const res = await fetch(`${this.apiUrl}${path}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!res.ok) {
      return { ok: false, error: `Error al consultar DulceGestion (${res.status}: ${res.statusText})` };
    }

    return { ok: true, data: await res.json() };
  }

  private async getOrders(params: Record<string, unknown>, authToken: string): Promise<string> {
    const query = new URLSearchParams();
    if (params.status) query.set('status', String(params.status));
    if (params.startDate) query.set('startDate', String(params.startDate));
    if (params.endDate) query.set('endDate', String(params.endDate));

    const qs = query.toString();
    const result = await this.apiFetch(`/orders${qs ? `?${qs}` : ''}`, authToken);

    if (!result.ok) return result.error!;

    const orders = result.data as OrderSummary[];
    if (orders.length === 0) return 'No hay pedidos para el periodo consultado.';

    const lines = orders.slice(0, 15).map((o) => {
      const customer = o.customer?.name ?? 'Sin cliente';
      const date = new Date(o.delivery_date);
      const dayName = date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
      return `- Pedido #${o.id} | ${customer} | ${o.status} | Entrega: ${dayName}`;
    });

    const header = `${orders.length} pedido${orders.length === 1 ? '' : 's'}:`;
    return [header, ...lines].join('\n');
  }

  private async getStock(_params: Record<string, unknown>, authToken: string): Promise<string> {
    const result = await this.apiFetch('/ingredients', authToken);

    if (!result.ok) return result.error!;

    const ingredients = result.data as IngredientSummary[];
    if (ingredients.length === 0) return 'No hay ingredientes cargados en tu despensa.';

    const low = ingredients.filter((i) => i.stock_threshold != null && i.stock <= i.stock_threshold);
    const lines = ingredients.slice(0, 15).map((i) => `- ${i.name}: ${i.stock} ${i.unit}`);

    let text = `Tenes ${ingredients.length} ingredientes en tu despensa:\n${lines.join('\n')}`;
    if (low.length > 0) {
      const lowLines = low.map((i) => `- ${i.name}: ${i.stock} ${i.unit} (umbral: ${i.stock_threshold})`);
      text += `\n\nIngredientes con stock bajo:\n${lowLines.join('\n')}`;
    }
    return text;
  }

  private async getCustomers(params: Record<string, unknown>, authToken: string): Promise<string> {
    const result = await this.apiFetch('/customers?_include=balance', authToken);

    if (!result.ok) return result.error!;

    const customers = result.data as (CustomerSummary & { balance?: number })[];
    if (customers.length === 0) return 'No hay clientes registrados.';

    const lines = customers.slice(0, 10).map((c) => {
      const phone = c.phone ? ` | Tel: ${c.phone}` : '';
      return `- ${c.name}${phone}`;
    });

    return `Tenes ${customers.length} cliente${customers.length === 1 ? '' : 's'}:\n${lines.join('\n')}`;
  }
}
