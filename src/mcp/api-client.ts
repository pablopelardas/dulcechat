export interface ApiResult {
  ok: boolean;
  data?: unknown;
  error?: string;
}

export class ApiClient {
  constructor(private baseUrl: string) {}

  async fetch(path: string, authToken: string): Promise<ApiResult> {
    if (!authToken) {
      return { ok: false, error: 'No estas autenticado. Inicia sesion en DulceGestion para consultar datos.' };
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!res.ok) {
      return { ok: false, error: `Error al consultar DulceGestion (${res.status}: ${res.statusText})` };
    }

    return { ok: true, data: await res.json() };
  }

  async post(path: string, body: unknown, authToken: string): Promise<ApiResult> {
    if (!authToken) {
      return { ok: false, error: 'No estas autenticado. Inicia sesion en DulceGestion para consultar datos.' };
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return { ok: false, error: `Error al consultar DulceGestion (${res.status}: ${res.statusText})` };
    }

    return { ok: true, data: await res.json() };
  }
}
