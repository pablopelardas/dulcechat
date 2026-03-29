# Write Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add write MCP tools (crear_pedido, crear_cliente, crear_descuento) and a search tool (buscar_items) to Caramelo, with confirmation-based UX and disambiguation.

**Architecture:** New endpoint in DulceGestion API for item search with calculated prices. New POST support in ApiClient. Four new MCP tools following existing factory pattern. System prompt updated for confirmation/disambiguation rules. New RAG doc for discounts.

**Tech Stack:** TypeScript, Express, Prisma, Vitest, shared/costCalculations.js

**Repos:**
- DulceGestion API: `~/working/webboost/GestionPasteleria`
- DulceChat bot: `~/working/webboost/dulcechat`

---

## Task 1: Add `?q=` filter to customers API endpoint

**Files:**
- Modify: `~/working/webboost/GestionPasteleria/server/routes/customers.js:110-130`

- [ ] **Step 1: Add name filter to GET /api/customers**

In `server/routes/customers.js`, modify the `GET /` handler's `where` clause to support `?q=` query param:

```javascript
router.get('/', asyncHandler(async (req, res) => {
    const includeBalance = req.query._include === 'balance';
    const nameFilter = req.query.q
        ? { name: { contains: String(req.query.q), mode: 'insensitive' } }
        : {};

    const customers = await prisma.customer.findMany({
        where: { organizationId: req.user.organizationId, ...nameFilter },
        orderBy: { name: 'asc' },
        ...(includeBalance ? { include: BALANCE_INCLUDE } : {}),
    });
```

The rest of the handler stays the same.

- [ ] **Step 2: Test manually or verify existing tests still pass**

Run any existing tests for this route if available, or test via curl:
```bash
curl -H "Authorization: Bearer <token>" "http://localhost:3001/api/customers?q=maria"
```

- [ ] **Step 3: Commit**

```bash
cd ~/working/webboost/GestionPasteleria
git add server/routes/customers.js
git commit -m "feat: add q= name filter to GET /api/customers"
```

---

## Task 2: Create `GET /api/bot/search-items` endpoint

**Files:**
- Create: `~/working/webboost/GestionPasteleria/server/routes/bot.js`
- Modify: `~/working/webboost/GestionPasteleria/server/app.js`

- [ ] **Step 1: Create bot routes file**

Create `server/routes/bot.js`:

```javascript
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { asyncHandler } = require('../middleware/asyncHandler');
const { calculateSellingPrice, calculateProductSellingPrice } = require('../../shared/costCalculations');

const recipeInclude = {
  ingredients: { include: { ingredient: true }, orderBy: { sortOrder: 'asc' } },
  components: {
    include: {
      componentRecipe: {
        include: {
          ingredients: { include: { ingredient: true }, orderBy: { sortOrder: 'asc' } },
          components: {
            include: {
              componentRecipe: {
                include: {
                  ingredients: { include: { ingredient: true }, orderBy: { sortOrder: 'asc' } },
                  supplies: { include: { supply: true }, orderBy: { sortOrder: 'asc' } },
                },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
          supplies: { include: { supply: true }, orderBy: { sortOrder: 'asc' } },
        },
      },
    },
    orderBy: { sortOrder: 'asc' },
  },
  supplies: { include: { supply: true }, orderBy: { sortOrder: 'asc' } },
};

const productInclude = {
  recipes: {
    include: {
      recipe: {
        include: recipeInclude,
      },
    },
  },
  supplies: { include: { supply: true } },
};

router.get('/search-items', asyncHandler(async (req, res) => {
  const q = req.query.q ? String(req.query.q).trim() : '';
  if (!q) return res.json({ items: [], priceRounding: 1 });

  const orgId = req.user.organizationId;

  const settings = await prisma.organizationSettings.findUnique({
    where: { organizationId: orgId },
  });
  const priceRounding = settings?.price_rounding || 1;

  const [recipes, products] = await Promise.all([
    prisma.recipe.findMany({
      where: { organizationId: orgId, name: { contains: q, mode: 'insensitive' } },
      include: recipeInclude,
      orderBy: { name: 'asc' },
      take: 15,
    }),
    prisma.product.findMany({
      where: { organizationId: orgId, name: { contains: q, mode: 'insensitive' } },
      include: productInclude,
      orderBy: { name: 'asc' },
      take: 15,
    }),
  ]);

  const items = [
    ...recipes.map(r => ({
      id: r.id,
      type: 'recipe',
      name: r.name,
      price: calculateSellingPrice(r, priceRounding),
    })),
    ...products.map(p => ({
      id: p.id,
      type: 'product',
      name: p.name,
      price: calculateProductSellingPrice(p, priceRounding),
    })),
  ];

  res.json({ items: items.slice(0, 15), priceRounding });
}));

module.exports = router;
```

- [ ] **Step 2: Register bot routes in app.js**

In `server/app.js`, add the import and route registration alongside existing routes. Find where other routes are registered (around line 82-111) and add:

```javascript
const botRouter = require('./routes/bot');
```

And in the route registration section:

```javascript
router.use('/api/bot', authenticateToken, allowOrganizationOverride, botRouter);
```

- [ ] **Step 3: Test the endpoint**

```bash
curl -H "Authorization: Bearer <token>" "http://localhost:3001/api/bot/search-items?q=torta"
```

Verify response has `{ items: [...], priceRounding: N }` with calculated prices.

- [ ] **Step 4: Commit**

```bash
cd ~/working/webboost/GestionPasteleria
git add server/routes/bot.js server/app.js
git commit -m "feat: add GET /api/bot/search-items endpoint with calculated prices"
```

---

## Task 3: Add POST support to ApiClient

**Files:**
- Modify: `~/working/webboost/dulcechat/src/mcp/api-client.ts`
- Modify: `~/working/webboost/dulcechat/tests/mcp/api-client.test.ts`

- [ ] **Step 1: Write failing tests for POST method**

Add these tests to `tests/mcp/api-client.test.ts`:

```typescript
  it('sends POST with JSON body and auth header', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, name: 'Test' }),
    });

    const result = await client.post('/customers', { name: 'Test' }, 'my-token');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/customers',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer my-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Test' }),
      },
    );
    expect(result).toEqual({ ok: true, data: { id: 1, name: 'Test' } });
  });

  it('returns error on POST without auth token', async () => {
    const result = await client.post('/customers', { name: 'Test' }, '');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('autenticado');
  });

  it('returns error on POST HTTP failure', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 400, statusText: 'Bad Request' });
    const result = await client.post('/orders', { items: [] }, 'token');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('400');
  });
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd ~/working/webboost/dulcechat && npx vitest run tests/mcp/api-client.test.ts
```

Expected: FAIL — `client.post is not a function`

- [ ] **Step 3: Implement post method**

In `src/mcp/api-client.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd ~/working/webboost/dulcechat && npx vitest run tests/mcp/api-client.test.ts
```

Expected: all 6 tests PASS

- [ ] **Step 5: Commit**

```bash
cd ~/working/webboost/dulcechat
git add src/mcp/api-client.ts tests/mcp/api-client.test.ts
git commit -m "feat: add POST support to ApiClient"
```

---

## Task 4: Add `query` param to `ver_clientes` tool

**Files:**
- Modify: `~/working/webboost/dulcechat/src/mcp/tools/customers.ts`
- Create: `~/working/webboost/dulcechat/tests/mcp/tools/customers.test.ts`

- [ ] **Step 1: Write tests**

Create `tests/mcp/tools/customers.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { customersTool } from '../../../src/mcp/tools/customers.js';
import { ApiClient } from '../../../src/mcp/api-client.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('customersTool', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('has correct name and schema with query param', () => {
    const client = new ApiClient('http://localhost:3001/api');
    const tool = customersTool(client);
    expect(tool.name).toBe('ver_clientes');
    expect(tool.inputSchema.properties).toHaveProperty('query');
  });

  it('passes q= param when query is provided', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 1, name: 'Maria Lopez', phone: '1155443322', balance: 0 },
      ],
    });

    const client = new ApiClient('http://localhost:3001/api');
    const tool = customersTool(client);
    await tool.execute({ query: 'Maria' }, 'token');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/customers?_include=balance&q=Maria',
      expect.objectContaining({ headers: { Authorization: 'Bearer token' } }),
    );
  });

  it('omits q= param when query is not provided', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    const client = new ApiClient('http://localhost:3001/api');
    const tool = customersTool(client);
    await tool.execute({}, 'token');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/customers?_include=balance',
      expect.objectContaining({ headers: { Authorization: 'Bearer token' } }),
    );
  });

  it('returns compact customer data with id', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 1, name: 'Maria Lopez', phone: '1155443322', balance: 500 },
        { id: 2, name: 'Maria Garcia', phone: null, balance: 0 },
      ],
    });

    const client = new ApiClient('http://localhost:3001/api');
    const tool = customersTool(client);
    const result = await tool.execute({ query: 'Maria' }, 'token');

    expect(result).toEqual({
      total: 2,
      customers: [
        { id: 1, name: 'Maria Lopez', phone: '1155443322', balance: 500 },
        { id: 2, name: 'Maria Garcia', phone: null, balance: 0 },
      ],
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd ~/working/webboost/dulcechat && npx vitest run tests/mcp/tools/customers.test.ts
```

Expected: FAIL — schema doesn't have `query`, URL doesn't include `q=`, result doesn't include `id`.

- [ ] **Step 3: Update customers tool**

Replace `src/mcp/tools/customers.ts`:

```typescript
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
```

Key changes: added `query` to inputSchema, pass `q=` to API, include `id` in response (needed for crear_pedido).

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd ~/working/webboost/dulcechat && npx vitest run tests/mcp/tools/customers.test.ts
```

Expected: all 4 tests PASS

- [ ] **Step 5: Commit**

```bash
cd ~/working/webboost/dulcechat
git add src/mcp/tools/customers.ts tests/mcp/tools/customers.test.ts
git commit -m "feat: add query param to ver_clientes tool"
```

---

## Task 5: Create `buscar_items` tool

**Files:**
- Create: `~/working/webboost/dulcechat/src/mcp/tools/search-items.ts`
- Create: `~/working/webboost/dulcechat/tests/mcp/tools/search-items.test.ts`

- [ ] **Step 1: Write tests**

Create `tests/mcp/tools/search-items.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchItemsTool } from '../../../src/mcp/tools/search-items.js';
import { ApiClient } from '../../../src/mcp/api-client.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('searchItemsTool', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('has correct name and schema', () => {
    const client = new ApiClient('http://localhost:3001/api');
    const tool = searchItemsTool(client);
    expect(tool.name).toBe('buscar_items');
    expect(tool.inputSchema.properties).toHaveProperty('query');
  });

  it('calls bot/search-items endpoint with query', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          { id: 5, type: 'product', name: 'Torta Brownie 20p', price: 15000 },
          { id: 3, type: 'recipe', name: 'Torta Brownie 10p', price: 8500 },
        ],
        priceRounding: 50,
      }),
    });

    const client = new ApiClient('http://localhost:3001/api');
    const tool = searchItemsTool(client);
    const result = await tool.execute({ query: 'torta brownie' }, 'token');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/bot/search-items?q=torta+brownie',
      expect.objectContaining({ headers: { Authorization: 'Bearer token' } }),
    );
    expect(result).toEqual({
      items: [
        { id: 5, type: 'product', name: 'Torta Brownie 20p', price: 15000 },
        { id: 3, type: 'recipe', name: 'Torta Brownie 10p', price: 8500 },
      ],
      priceRounding: 50,
    });
  });

  it('returns error when not authenticated', async () => {
    const client = new ApiClient('http://localhost:3001/api');
    const tool = searchItemsTool(client);
    const result = await tool.execute({ query: 'torta' }, '');
    expect(result).toHaveProperty('error');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd ~/working/webboost/dulcechat && npx vitest run tests/mcp/tools/search-items.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement the tool**

Create `src/mcp/tools/search-items.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd ~/working/webboost/dulcechat && npx vitest run tests/mcp/tools/search-items.test.ts
```

Expected: all 3 tests PASS

- [ ] **Step 5: Commit**

```bash
cd ~/working/webboost/dulcechat
git add src/mcp/tools/search-items.ts tests/mcp/tools/search-items.test.ts
git commit -m "feat: add buscar_items MCP tool"
```

---

## Task 6: Create `crear_pedido` tool

**Files:**
- Create: `~/working/webboost/dulcechat/src/mcp/tools/create-order.ts`
- Create: `~/working/webboost/dulcechat/tests/mcp/tools/create-order.test.ts`

- [ ] **Step 1: Write tests**

Create `tests/mcp/tools/create-order.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOrderTool } from '../../../src/mcp/tools/create-order.js';
import { ApiClient } from '../../../src/mcp/api-client.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('createOrderTool', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('has correct name and schema', () => {
    const client = new ApiClient('http://localhost:3001/api');
    const tool = createOrderTool(client);
    expect(tool.name).toBe('crear_pedido');
    expect(tool.inputSchema.properties).toHaveProperty('customerId');
    expect(tool.inputSchema.properties).toHaveProperty('delivery_date');
    expect(tool.inputSchema.properties).toHaveProperty('items');
    expect(tool.inputSchema.required).toEqual(['customerId', 'items', 'delivery_date']);
  });

  it('sends POST and returns compact order data', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 10,
        orderNumber: '2603-010',
        customerId: 1,
        customer: { id: 1, name: 'Maria Lopez', phone: '1155443322' },
        status: 'pending',
        delivery_date: '2026-04-05T00:00:00Z',
        items: [
          { id: 1, quantity: 2, price: 15000, product: { id: 5, name: 'Torta Brownie 20p' }, recipe: null },
        ],
        payments: [],
        notes: null,
        adjustment: 0,
        discount_code: null,
        source: 'manual',
      }),
    });

    const client = new ApiClient('http://localhost:3001/api');
    const tool = createOrderTool(client);
    const result = await tool.execute({
      customerId: 1,
      delivery_date: '2026-04-05',
      items: [{ productId: 5, quantity: 2, price: 15000 }],
    }, 'token');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/orders',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          customerId: 1,
          delivery_date: '2026-04-05',
          items: [{ productId: 5, quantity: 2, price: 15000 }],
        }),
      }),
    );

    expect(result).toEqual({
      id: 10,
      orderNumber: '2603-010',
      customer: 'Maria Lopez',
      status: 'pending',
      total: 30000,
    });
  });

  it('passes optional notes and discount_code', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 11,
        orderNumber: '2603-011',
        customer: { name: 'Juan' },
        status: 'pending',
        items: [{ quantity: 1, price: 5000 }],
        adjustment: -500,
        discount_code: 'PROMO10',
      }),
    });

    const client = new ApiClient('http://localhost:3001/api');
    const tool = createOrderTool(client);
    await tool.execute({
      customerId: 2,
      delivery_date: '2026-04-06',
      items: [{ recipeId: 3, quantity: 1, price: 5000 }],
      notes: 'Sin gluten',
      discount_code: 'PROMO10',
    }, 'token');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.notes).toBe('Sin gluten');
    expect(body.discount_code).toBe('PROMO10');
  });

  it('returns error when not authenticated', async () => {
    const client = new ApiClient('http://localhost:3001/api');
    const tool = createOrderTool(client);
    const result = await tool.execute({ customerId: 1, items: [], delivery_date: '2026-04-05' }, '');
    expect(result).toHaveProperty('error');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd ~/working/webboost/dulcechat && npx vitest run tests/mcp/tools/create-order.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement the tool**

Create `src/mcp/tools/create-order.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd ~/working/webboost/dulcechat && npx vitest run tests/mcp/tools/create-order.test.ts
```

Expected: all 4 tests PASS

- [ ] **Step 5: Commit**

```bash
cd ~/working/webboost/dulcechat
git add src/mcp/tools/create-order.ts tests/mcp/tools/create-order.test.ts
git commit -m "feat: add crear_pedido MCP tool"
```

---

## Task 7: Create `crear_cliente` tool

**Files:**
- Create: `~/working/webboost/dulcechat/src/mcp/tools/create-customer.ts`
- Create: `~/working/webboost/dulcechat/tests/mcp/tools/create-customer.test.ts`

- [ ] **Step 1: Write tests**

Create `tests/mcp/tools/create-customer.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCustomerTool } from '../../../src/mcp/tools/create-customer.js';
import { ApiClient } from '../../../src/mcp/api-client.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('createCustomerTool', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('has correct name and schema', () => {
    const client = new ApiClient('http://localhost:3001/api');
    const tool = createCustomerTool(client);
    expect(tool.name).toBe('crear_cliente');
    expect(tool.inputSchema.properties).toHaveProperty('name');
    expect(tool.inputSchema.required).toEqual(['name']);
  });

  it('sends POST and returns compact data', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 15,
        name: 'Juan Perez',
        phone: '1155443322',
        address: 'Av Corrientes 1234',
        notes: null,
        portal_token: null,
        created_at: '2026-03-29T10:00:00Z',
        organizationId: 1,
      }),
    });

    const client = new ApiClient('http://localhost:3001/api');
    const tool = createCustomerTool(client);
    const result = await tool.execute({
      name: 'Juan Perez',
      phone: '1155443322',
      address: 'Av Corrientes 1234',
    }, 'token');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toEqual({ name: 'Juan Perez', phone: '1155443322', address: 'Av Corrientes 1234' });

    expect(result).toEqual({
      id: 15,
      name: 'Juan Perez',
      phone: '1155443322',
    });
  });

  it('sends only name when optional fields are omitted', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 16, name: 'Ana', phone: null }),
    });

    const client = new ApiClient('http://localhost:3001/api');
    const tool = createCustomerTool(client);
    await tool.execute({ name: 'Ana' }, 'token');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toEqual({ name: 'Ana' });
  });

  it('returns error when not authenticated', async () => {
    const client = new ApiClient('http://localhost:3001/api');
    const tool = createCustomerTool(client);
    const result = await tool.execute({ name: 'Test' }, '');
    expect(result).toHaveProperty('error');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd ~/working/webboost/dulcechat && npx vitest run tests/mcp/tools/create-customer.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement the tool**

Create `src/mcp/tools/create-customer.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd ~/working/webboost/dulcechat && npx vitest run tests/mcp/tools/create-customer.test.ts
```

Expected: all 4 tests PASS

- [ ] **Step 5: Commit**

```bash
cd ~/working/webboost/dulcechat
git add src/mcp/tools/create-customer.ts tests/mcp/tools/create-customer.test.ts
git commit -m "feat: add crear_cliente MCP tool"
```

---

## Task 8: Create `crear_descuento` tool

**Files:**
- Create: `~/working/webboost/dulcechat/src/mcp/tools/create-discount.ts`
- Create: `~/working/webboost/dulcechat/tests/mcp/tools/create-discount.test.ts`

- [ ] **Step 1: Write tests**

Create `tests/mcp/tools/create-discount.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDiscountTool } from '../../../src/mcp/tools/create-discount.js';
import { ApiClient } from '../../../src/mcp/api-client.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('createDiscountTool', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('has correct name and schema', () => {
    const client = new ApiClient('http://localhost:3001/api');
    const tool = createDiscountTool(client);
    expect(tool.name).toBe('crear_descuento');
    expect(tool.inputSchema.required).toEqual(['code', 'type', 'value']);
  });

  it('sends POST and returns compact data', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 3,
        code: 'PROMO10',
        type: 'percentage',
        value: 10,
        min_order: null,
        max_uses: null,
        current_uses: 0,
        is_active: true,
        expires_at: null,
        organizationId: 1,
        created_at: '2026-03-29T10:00:00Z',
      }),
    });

    const client = new ApiClient('http://localhost:3001/api');
    const tool = createDiscountTool(client);
    const result = await tool.execute({
      code: 'PROMO10',
      type: 'percentage',
      value: 10,
    }, 'token');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toEqual({ code: 'PROMO10', type: 'percentage', value: 10 });

    expect(result).toEqual({
      id: 3,
      code: 'PROMO10',
      type: 'percentage',
      value: 10,
    });
  });

  it('passes optional fields', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 4,
        code: 'FIJO500',
        type: 'fixed',
        value: 500,
        min_order: 3000,
        max_uses: 50,
        expires_at: '2026-12-31T23:59:59Z',
      }),
    });

    const client = new ApiClient('http://localhost:3001/api');
    const tool = createDiscountTool(client);
    await tool.execute({
      code: 'FIJO500',
      type: 'fixed',
      value: 500,
      min_order: 3000,
      max_uses: 50,
      expires_at: '2026-12-31',
    }, 'token');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.min_order).toBe(3000);
    expect(body.max_uses).toBe(50);
    expect(body.expires_at).toBe('2026-12-31');
  });

  it('returns error when not authenticated', async () => {
    const client = new ApiClient('http://localhost:3001/api');
    const tool = createDiscountTool(client);
    const result = await tool.execute({ code: 'X', type: 'fixed', value: 100 }, '');
    expect(result).toHaveProperty('error');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd ~/working/webboost/dulcechat && npx vitest run tests/mcp/tools/create-discount.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement the tool**

Create `src/mcp/tools/create-discount.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd ~/working/webboost/dulcechat && npx vitest run tests/mcp/tools/create-discount.test.ts
```

Expected: all 4 tests PASS

- [ ] **Step 5: Commit**

```bash
cd ~/working/webboost/dulcechat
git add src/mcp/tools/create-discount.ts tests/mcp/tools/create-discount.test.ts
git commit -m "feat: add crear_descuento MCP tool"
```

---

## Task 9: Register new tools in index.ts

**Files:**
- Modify: `~/working/webboost/dulcechat/src/index.ts`

- [ ] **Step 1: Add imports and registration**

In `src/index.ts`, add the imports alongside existing tool imports:

```typescript
import { searchItemsTool } from './mcp/tools/search-items.js';
import { createOrderTool } from './mcp/tools/create-order.js';
import { createCustomerTool } from './mcp/tools/create-customer.js';
import { createDiscountTool } from './mcp/tools/create-discount.js';
```

And in the tool registration section (after the existing `tools.register` calls):

```typescript
  tools.register(searchItemsTool(api));
  tools.register(createOrderTool(api));
  tools.register(createCustomerTool(api));
  tools.register(createDiscountTool(api));
```

- [ ] **Step 2: Run all tests**

```bash
cd ~/working/webboost/dulcechat && npx vitest run
```

Expected: all tests PASS

- [ ] **Step 3: Commit**

```bash
cd ~/working/webboost/dulcechat
git add src/index.ts
git commit -m "feat: register write tools in bot entry point"
```

---

## Task 10: Update system prompt

**Files:**
- Modify: `~/working/webboost/dulcechat/src/llm/claude.ts`

- [ ] **Step 1: Update SYSTEM_PROMPT**

Replace the `SYSTEM_PROMPT` constant in `src/llm/claude.ts`:

```typescript
const SYSTEM_PROMPT = `Sos Caramelo, el asistente virtual de DulceGestion, una aplicacion de gestion para pastelerias y emprendimientos de reposteria.

Tu rol es:
- Responder preguntas sobre como usar la aplicacion
- Consultar datos del negocio (pedidos, stock, clientes) cuando el usuario lo pida
- Crear pedidos, clientes y codigos de descuento cuando el usuario lo pida
- Ser amable, conciso y hablar en espanol rioplatense

Reglas:
- Si el usuario pregunta algo sobre la app y tenes contexto de documentacion, usa esa informacion para responder.
- Si el usuario pide datos del negocio, usa las herramientas disponibles.
- Si no sabes algo, decilo honestamente. No inventes pasos ni funcionalidades que no esten en la documentacion.
- Cuando presentes datos (pedidos, stock, etc.), organiza la informacion cronologicamente y de forma clara. No reagrupes ni reordenes los datos de formas confusas.
- Se conciso. No repitas informacion ni agregues explicaciones innecesarias.

Reglas para acciones de escritura (crear pedidos, clientes, descuentos):
- SIEMPRE mostra un resumen de lo que vas a crear y espera a que el usuario confirme con "si" antes de ejecutar la herramienta.
- NUNCA crees nada sin confirmacion explicita del usuario.
- Si al buscar un cliente o item hay multiples resultados, presenta opciones numeradas y pedile al usuario que elija por numero.
- Si al buscar un cliente no hay resultados, pregunta si quiere crear uno nuevo.
- Para pedidos: primero busca el cliente (ver_clientes), luego busca los items (buscar_items), confirma todo y recien ahi crea el pedido (crear_pedido).
- Para crear cliente: primero busca si ya existe (ver_clientes). Si existe, pregunta si es esa persona o si quiere crear uno nuevo.
- Cuando busques items, usa el campo "type" para saber si es receta (recipeId) o producto (productId) al armar el pedido.`;
```

- [ ] **Step 2: Run all tests**

```bash
cd ~/working/webboost/dulcechat && npx vitest run
```

Expected: all tests PASS

- [ ] **Step 3: Commit**

```bash
cd ~/working/webboost/dulcechat
git add src/llm/claude.ts
git commit -m "feat: update system prompt with write tool rules"
```

---

## Task 11: Create RAG doc for discounts

**Files:**
- Create: `~/working/webboost/dulcechat/docs/flows/descuentos.md`

- [ ] **Step 1: Create the document**

Create `docs/flows/descuentos.md`:

```markdown
# Codigos de Descuento

Los codigos de descuento permiten ofrecer rebajas a tus clientes al momento de crear un pedido.

## Crear un codigo de descuento

Para crear un codigo de descuento anda a **Descuentos** en el menu lateral. Toca **Nuevo codigo** y completa:

- **Codigo**: el texto que el cliente va a usar (ej: PROMO10, VERANO2026). Se guarda en mayusculas.
- **Tipo**: puede ser **porcentaje** (ej: 10% de descuento) o **monto fijo** (ej: $500 de descuento).
- **Valor**: el numero del descuento. Si es porcentaje, un valor entre 1 y 100. Si es fijo, el monto en pesos.
- **Pedido minimo** (opcional): monto minimo que debe tener el pedido para poder usar el codigo.
- **Maximo de usos** (opcional): cuantas veces se puede usar el codigo. Si no se pone limite, es ilimitado.
- **Fecha de vencimiento** (opcional): despues de esta fecha el codigo deja de funcionar.

## Aplicar un descuento a un pedido

Al crear un pedido, hay un campo **Codigo de descuento**. Ingresa el codigo y el sistema valida automaticamente:

- Que el codigo exista y este activo
- Que no haya vencido
- Que no haya superado el limite de usos
- Que el pedido cumpla el monto minimo

Si el codigo es valido, el descuento se aplica automaticamente al total del pedido.

## Administrar codigos

Desde la seccion **Descuentos** podes:

- **Editar** un codigo: cambiar el valor, tipo, limites o vencimiento.
- **Desactivar** un codigo: lo deja inactivo sin borrarlo. Se puede reactivar despues.
- **Eliminar** un codigo: lo borra permanentemente.
- **Ver usos**: cada codigo muestra cuantas veces fue utilizado.

## Tipos de descuento

- **Porcentaje**: descuenta un % del subtotal del pedido. Ejemplo: PROMO10 con valor 10 descuenta el 10%.
- **Monto fijo**: descuenta un monto fijo en pesos. Ejemplo: DESCUENTO500 con valor 500 descuenta $500.
```

- [ ] **Step 2: Regenerate embeddings**

```bash
cd ~/working/webboost/dulcechat && npx tsx scripts/generate-embeddings.ts
```

Verify output shows the new chunks from descuentos.md were indexed.

- [ ] **Step 3: Commit**

```bash
cd ~/working/webboost/dulcechat
git add docs/flows/descuentos.md data/embeddings.json
git commit -m "feat: add RAG doc for discount codes"
```

---

## Task 12: Final integration test

- [ ] **Step 1: Run full test suite**

```bash
cd ~/working/webboost/dulcechat && npx vitest run
```

Expected: all tests PASS (should be ~46+ tests: 34 existing + new ones)

- [ ] **Step 2: Build to check TypeScript compilation**

```bash
cd ~/working/webboost/dulcechat && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Smoke test locally (optional)**

Start both services and test via the widget:
1. Start DulceGestion API: `cd ~/working/webboost/GestionPasteleria && npm run dev`
2. Start DulceChat: `cd ~/working/webboost/dulcechat && npm run dev`
3. Open widget, login, and test: "Busca torta brownie", "Crea un cliente Juan Perez", etc.
