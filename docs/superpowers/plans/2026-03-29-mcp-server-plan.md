# MCP Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded actions system with an MCP-based tool registry that works both internally (DulceChat) and externally (Claude Desktop/Code).

**Architecture:** Tools live in `src/mcp/tools/`, registered via a central registry. DulceChat imports tools directly. An MCP stdio server exposes the same tools for external clients. Claude LLM adapter reads tools from the registry dynamically.

**Tech Stack:** TypeScript, @modelcontextprotocol/sdk, existing DulceChat stack

---

## File Structure

```
src/mcp/
  tool.ts             # McpTool interface
  registry.ts         # ToolRegistry class
  api-client.ts       # Shared fetch helper for DulceGestion API
  tools/
    orders.ts         # ver_pedidos tool
    stock.ts          # ver_stock tool
    customers.ts      # ver_clientes tool
  server.ts           # MCP stdio server for Claude Desktop/Code
```

**Modified:**
- `src/engine.ts` — use ToolRegistry instead of DulceGestionActions
- `src/llm/claude.ts` — read tools from registry, remove hardcoded TOOLS array
- `src/llm/hardcoded.ts` — no changes (keyword matching stays as is)
- `src/index.ts` — instantiate ToolRegistry instead of DulceGestionActions

**Deleted:**
- `src/actions/action.ts`
- `src/actions/dulcegestion.ts`
- `tests/actions/dulcegestion.test.ts`

---

### Task 1: McpTool interface and ToolRegistry

**Files:**
- Create: `src/mcp/tool.ts`
- Create: `src/mcp/registry.ts`
- Create: `tests/mcp/registry.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/mcp/registry.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ToolRegistry } from '../src/mcp/registry.js';
import { McpTool } from '../src/mcp/tool.js';

const fakeTool: McpTool = {
  name: 'test_tool',
  description: 'A test tool',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
    },
  },
  execute: async () => ({ result: 'ok' }),
};

describe('ToolRegistry', () => {
  it('registers and retrieves a tool', () => {
    const registry = new ToolRegistry();
    registry.register(fakeTool);
    expect(registry.get('test_tool')).toBe(fakeTool);
  });

  it('returns undefined for unknown tool', () => {
    const registry = new ToolRegistry();
    expect(registry.get('nope')).toBeUndefined();
  });

  it('lists all registered tools', () => {
    const registry = new ToolRegistry();
    registry.register(fakeTool);
    expect(registry.getAll()).toHaveLength(1);
    expect(registry.getAll()[0].name).toBe('test_tool');
  });

  it('generates Claude API tool format', () => {
    const registry = new ToolRegistry();
    registry.register(fakeTool);
    const claudeTools = registry.toClaudeTools();
    expect(claudeTools).toHaveLength(1);
    expect(claudeTools[0]).toEqual({
      name: 'test_tool',
      description: 'A test tool',
      input_schema: fakeTool.inputSchema,
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd ~/working/webboost/dulcechat
npx vitest run tests/mcp/registry.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Create McpTool interface**

Create `src/mcp/tool.ts`:

```typescript
export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute(params: Record<string, unknown>, authToken: string): Promise<unknown>;
}
```

- [ ] **Step 4: Implement ToolRegistry**

Create `src/mcp/registry.ts`:

```typescript
import { McpTool } from './tool.js';

export class ToolRegistry {
  private tools = new Map<string, McpTool>();

  register(tool: McpTool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): McpTool | undefined {
    return this.tools.get(name);
  }

  getAll(): McpTool[] {
    return Array.from(this.tools.values());
  }

  toClaudeTools(): { name: string; description: string; input_schema: Record<string, unknown> }[] {
    return this.getAll().map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema,
    }));
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run tests/mcp/registry.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/mcp/tool.ts src/mcp/registry.ts tests/mcp/registry.test.ts
git commit -m "feat: add McpTool interface and ToolRegistry"
```

---

### Task 2: API client helper

**Files:**
- Create: `src/mcp/api-client.ts`
- Create: `tests/mcp/api-client.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/mcp/api-client.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClient } from '../src/mcp/api-client.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('ApiClient', () => {
  const client = new ApiClient('http://localhost:3001/api');

  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('calls API with auth header and returns data', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ id: 1 }],
    });

    const result = await client.fetch('/orders', 'my-token');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/orders',
      { headers: { Authorization: 'Bearer my-token' } },
    );
    expect(result).toEqual({ ok: true, data: [{ id: 1 }] });
  });

  it('returns error when no auth token', async () => {
    const result = await client.fetch('/orders', '');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('autenticado');
  });

  it('returns error on HTTP failure', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401, statusText: 'Unauthorized' });
    const result = await client.fetch('/orders', 'bad-token');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('401');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/mcp/api-client.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement ApiClient**

Create `src/mcp/api-client.ts`:

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
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/mcp/api-client.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/mcp/api-client.ts tests/mcp/api-client.test.ts
git commit -m "feat: add shared API client for MCP tools"
```

---

### Task 3: Order, stock, and customer tools

**Files:**
- Create: `src/mcp/tools/orders.ts`
- Create: `src/mcp/tools/stock.ts`
- Create: `src/mcp/tools/customers.ts`
- Create: `tests/mcp/tools/orders.test.ts`

- [ ] **Step 1: Write failing tests for orders tool**

Create `tests/mcp/tools/orders.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ordersTool } from '../src/mcp/tools/orders.js';
import { ApiClient } from '../src/mcp/api-client.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('ordersTool', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('has correct name and schema', () => {
    const client = new ApiClient('http://localhost:3001/api');
    const tool = ordersTool(client);
    expect(tool.name).toBe('ver_pedidos');
    expect(tool.inputSchema.properties).toHaveProperty('status');
    expect(tool.inputSchema.properties).toHaveProperty('startDate');
    expect(tool.inputSchema.properties).toHaveProperty('endDate');
  });

  it('returns compact order data', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 44, status: 'pending', delivery_date: '2026-04-02T15:00:00Z', customer: { name: 'Camila' }, total: 5000 },
      ],
    });

    const client = new ApiClient('http://localhost:3001/api');
    const tool = ordersTool(client);
    const result = await tool.execute({ startDate: '2026-04-01', endDate: '2026-04-07' }, 'token');

    expect(result).toEqual({
      count: 1,
      orders: [{ id: 44, customer: 'Camila', status: 'pending', date: expect.any(String), total: 5000 }],
    });
  });

  it('returns error object when not authenticated', async () => {
    const client = new ApiClient('http://localhost:3001/api');
    const tool = ordersTool(client);
    const result = await tool.execute({}, '');
    expect(result).toHaveProperty('error');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/mcp/tools/orders.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement orders tool**

Create `src/mcp/tools/orders.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/mcp/tools/orders.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Implement stock tool**

Create `src/mcp/tools/stock.ts`:

```typescript
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
```

- [ ] **Step 6: Implement customers tool**

Create `src/mcp/tools/customers.ts`:

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
```

- [ ] **Step 7: Commit**

```bash
git add src/mcp/tools/
git commit -m "feat: add orders, stock, and customers MCP tools"
```

---

### Task 4: Wire registry into engine and Claude adapter

**Files:**
- Modify: `src/engine.ts`
- Modify: `src/llm/claude.ts`
- Modify: `src/index.ts`
- Delete: `src/actions/action.ts`
- Delete: `src/actions/dulcegestion.ts`
- Delete: `tests/actions/dulcegestion.test.ts`
- Modify: `tests/engine.test.ts`

- [ ] **Step 1: Update engine.ts to use ToolRegistry**

Replace contents of `src/engine.ts`:

```typescript
import { IncomingMessage } from './channels/channel.js';
import { LLM } from './llm/llm.js';
import { Retriever } from './rag/retriever.js';
import { simpleEmbedding } from './rag/embeddings.js';
import { ToolRegistry } from './mcp/registry.js';
import { SessionStore } from './session/memory.js';

export class BotEngine {
  constructor(
    private llm: LLM,
    private retriever: Retriever,
    private tools: ToolRegistry,
    private sessions: SessionStore,
  ) {}

  async handleMessage(msg: IncomingMessage): Promise<string> {
    const session = this.sessions.get(msg.chatId);

    if (msg.authToken) {
      session.authToken = msg.authToken;
    }

    // Search for relevant documentation
    const queryEmbedding = simpleEmbedding(msg.text);
    const relevantChunks = this.retriever.search(queryEmbedding, 3, msg.text);
    const context = relevantChunks.length > 0
      ? relevantChunks.map((c) => c.text).join('\n\n---\n\n')
      : undefined;

    // First LLM call — may request a tool
    this.sessions.addMessage(msg.chatId, 'user', msg.text);
    console.log(`[engine] ${msg.chatId}: calling ${this.llm.name}...`);
    let response = await this.llm.respond({
      message: msg.text,
      history: session.history.slice(0, -1),
      context,
    });

    // If LLM wants to call a tool, execute it
    if (response.toolCall) {
      const authToken = session.authToken ?? '';
      const tool = this.tools.get(response.toolCall.name);

      if (!tool) {
        const reply = `No conozco la accion "${response.toolCall.name}".`;
        this.sessions.addMessage(msg.chatId, 'assistant', reply);
        return reply;
      }

      console.log(`[engine] ${msg.chatId}: tool call -> ${response.toolCall.name}(${JSON.stringify(response.toolCall.params)})`);
      const toolResult = await tool.execute(response.toolCall.params, authToken);
      const resultStr = JSON.stringify(toolResult);

      if (typeof toolResult === 'object' && toolResult !== null && 'error' in toolResult) {
        const errorMsg = (toolResult as { error: string }).error;
        this.sessions.addMessage(msg.chatId, 'assistant', errorMsg);
        return errorMsg;
      }

      // Second LLM call with tool result — no tools, just answer
      console.log(`[engine] ${msg.chatId}: calling ${this.llm.name} with tool data...`);
      response = await this.llm.respond({
        message: msg.text,
        history: session.history.slice(0, -1),
        context,
        actionData: resultStr,
      });
    }

    this.sessions.addMessage(msg.chatId, 'assistant', response.text);
    return response.text;
  }
}
```

- [ ] **Step 2: Update claude.ts to use registry**

Replace the `TOOLS` constant and constructor in `src/llm/claude.ts`. The ClaudeLLM constructor now accepts the registry:

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { LLM, LLMRequest, LLMResponse } from './llm.js';
import { ToolRegistry } from '../mcp/registry.js';

const SYSTEM_PROMPT = `Sos DulceChat, el asistente virtual de DulceGestion, una aplicacion de gestion para pastelerias y emprendimientos de reposteria.

Tu rol es:
- Responder preguntas sobre como usar la aplicacion
- Consultar datos del negocio (pedidos, stock, clientes) cuando el usuario lo pida
- Ser amable, conciso y hablar en espanol rioplatense

Reglas:
- Si el usuario pregunta algo sobre la app y tenes contexto de documentacion, usa esa informacion para responder.
- Si el usuario pide datos del negocio, usa las herramientas disponibles.
- Si no sabes algo, decilo honestamente. No inventes pasos ni funcionalidades que no esten en la documentacion.
- Cuando presentes datos (pedidos, stock, etc.), organiza la informacion cronologicamente y de forma clara. No reagrupes ni reordenes los datos de formas confusas.
- Se conciso. No repitas informacion ni agregues explicaciones innecesarias.`;

export class ClaudeLLM implements LLM {
  name = 'claude';
  private client: Anthropic;
  private claudeTools: Anthropic.Tool[];

  constructor(apiKey: string, registry?: ToolRegistry) {
    this.client = new Anthropic({ apiKey });
    this.claudeTools = (registry?.toClaudeTools() ?? []) as Anthropic.Tool[];
  }

  async respond(req: LLMRequest): Promise<LLMResponse> {
    const today = new Date().toLocaleDateString('es-AR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const todayISO = new Date().toISOString().split('T')[0];

    const systemParts: string[] = [
      SYSTEM_PROMPT,
      `\nFecha actual: ${today} (${todayISO}). Usa esta fecha para interpretar "hoy", "mañana", "la semana que viene", etc.`,
    ];

    if (req.context) {
      systemParts.push(`\nDocumentacion relevante:\n${req.context}`);
    }

    if (req.actionData) {
      systemParts.push(`\nResultado de consulta al sistema:\n${req.actionData}`);
    }

    const messages: Anthropic.MessageParam[] = req.history.map((h) => ({
      role: h.role,
      content: h.content,
    }));
    messages.push({ role: 'user', content: req.message });

    const useTools = !req.actionData && this.claudeTools.length > 0;

    const start = Date.now();
    try {
      var response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemParts.join('\n'),
        ...(useTools ? { tools: this.claudeTools } : {}),
        messages,
      });
      console.log(`[claude] response in ${Date.now() - start}ms, stop: ${response.stop_reason}`);
    } catch (err: any) {
      console.error(`[claude] error after ${Date.now() - start}ms:`, err.message);
      return { text: 'Hubo un error consultando al asistente. Intenta de nuevo.' };
    }

    const toolUse = response.content.find((block) => block.type === 'tool_use');
    if (toolUse && toolUse.type === 'tool_use') {
      return {
        text: '',
        toolCall: {
          name: toolUse.name,
          params: toolUse.input as Record<string, unknown>,
        },
      };
    }

    const textBlock = response.content.find((block) => block.type === 'text');
    return {
      text: textBlock && textBlock.type === 'text' ? textBlock.text : 'No pude generar una respuesta.',
    };
  }
}
```

- [ ] **Step 3: Update index.ts**

Replace imports and wiring in `src/index.ts`:

```typescript
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { config } from './config.js';
import { SessionStore } from './session/memory.js';
import { TelegramChannel } from './channels/telegram.js';
import { WhatsAppChannel } from './channels/whatsapp.js';
import { WebChannel } from './channels/web.js';
import { HardcodedLLM } from './llm/hardcoded.js';
import { Retriever, IndexedChunk } from './rag/retriever.js';
import { loadEmbeddings } from './rag/embeddings.js';
import { ToolRegistry } from './mcp/registry.js';
import { ApiClient } from './mcp/api-client.js';
import { ordersTool } from './mcp/tools/orders.js';
import { stockTool } from './mcp/tools/stock.js';
import { customersTool } from './mcp/tools/customers.js';
import { BotEngine } from './engine.js';
import { Channel } from './channels/channel.js';

async function main() {
  console.log('Starting DulceChat...');

  const chunks: IndexedChunk[] = await loadEmbeddings();
  console.log(`Loaded ${chunks.length} document chunks`);

  const sessions = new SessionStore({
    ttlMinutes: config.sessionTtlMinutes,
    maxHistory: config.sessionMaxHistory,
  });

  const retriever = new Retriever(chunks);

  // MCP Tool Registry
  const api = new ApiClient(config.dulceGestionApiUrl);
  const tools = new ToolRegistry();
  tools.register(ordersTool(api));
  tools.register(stockTool(api));
  tools.register(customersTool(api));
  console.log(`Registered ${tools.getAll().length} MCP tools`);

  const llm = config.llmAdapter === 'claude'
    ? await createClaudeLLM(tools)
    : new HardcodedLLM();

  console.log(`Using LLM adapter: ${llm.name}`);

  const engine = new BotEngine(llm, retriever, tools, sessions);

  const channels: Channel[] = [];

  const app = express();
  const server = createServer(app);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  const widgetDir = path.resolve('widget');
  app.use('/widget', express.static(widgetDir));
  app.get('/widget/chat', (_req, res) => {
    res.sendFile(path.join(widgetDir, 'index.html'));
  });
  app.get('/widget.js', (_req, res) => {
    res.sendFile(path.join(widgetDir, 'widget.js'));
  });

  const web = new WebChannel(config.port, config.widgetAllowedOrigin);
  web.onMessage((msg) => engine.handleMessage(msg));
  web.attachToServer(server);
  channels.push(web);

  if (config.telegramToken) {
    const telegram = new TelegramChannel(config.telegramToken);
    telegram.onMessage((msg) => engine.handleMessage(msg));
    await telegram.start();
    channels.push(telegram);
  }

  if (config.whatsappAccountSid) {
    const whatsapp = new WhatsAppChannel(
      config.whatsappAccountSid,
      config.whatsappAuthToken,
      config.whatsappPhoneNumber,
      app,
    );
    whatsapp.onMessage((msg) => engine.handleMessage(msg));
    await whatsapp.start();
    channels.push(whatsapp);
  }

  server.listen(config.port, () => {
    console.log(`[express] server on http://localhost:${config.port}`);
    console.log(`[widget] http://localhost:${config.port}/widget/chat`);
    console.log(`DulceChat running with ${channels.length} channel(s)`);
  });

  const shutdown = async () => {
    console.log('\nShutting down...');
    for (const ch of channels) {
      await ch.stop();
    }
    sessions.destroy();
    server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

async function createClaudeLLM(tools: ToolRegistry) {
  const { ClaudeLLM } = await import('./llm/claude.js');
  return new ClaudeLLM(config.anthropicApiKey, tools);
}

main().catch(console.error);
```

- [ ] **Step 4: Update engine tests**

Replace `tests/engine.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BotEngine } from '../src/engine.js';
import { LLM, LLMResponse } from '../src/llm/llm.js';
import { Retriever, IndexedChunk } from '../src/rag/retriever.js';
import { ToolRegistry } from '../src/mcp/registry.js';
import { SessionStore } from '../src/session/memory.js';

function createMockLLM(response: LLMResponse): LLM {
  return {
    name: 'mock',
    respond: vi.fn(async () => response),
  };
}

describe('BotEngine', () => {
  let engine: BotEngine;
  let mockLLM: LLM;
  let sessions: SessionStore;
  let tools: ToolRegistry;

  beforeEach(() => {
    mockLLM = createMockLLM({ text: 'Hello from bot' });
    sessions = new SessionStore({ ttlMinutes: 30, maxHistory: 20 });
    const chunks: IndexedChunk[] = [];
    const retriever = new Retriever(chunks);
    tools = new ToolRegistry();
    tools.register({
      name: 'ver_pedidos',
      description: 'Ver pedidos',
      inputSchema: { type: 'object', properties: {} },
      execute: async () => ({ count: 1, orders: [{ id: 1, customer: 'Test', status: 'pending', date: 'lun 1/4' }] }),
    });

    engine = new BotEngine(mockLLM, retriever, tools, sessions);
  });

  afterEach(() => {
    sessions.destroy();
  });

  it('processes a simple message and returns response', async () => {
    const reply = await engine.handleMessage({ chatId: 'chat1', text: 'hola' });
    expect(reply).toBe('Hello from bot');
  });

  it('stores messages in session history', async () => {
    await engine.handleMessage({ chatId: 'chat1', text: 'hola' });
    const session = sessions.get('chat1');
    expect(session.history).toHaveLength(2);
    expect(session.history[0]).toEqual({ role: 'user', content: 'hola' });
    expect(session.history[1]).toEqual({ role: 'assistant', content: 'Hello from bot' });
  });

  it('executes tool call when LLM requests one', async () => {
    const firstResponse: LLMResponse = {
      text: '',
      toolCall: { name: 'ver_pedidos', params: {} },
    };
    const secondResponse: LLMResponse = { text: 'Tenes 1 pedido pendiente.' };

    const respondFn = vi.fn()
      .mockResolvedValueOnce(firstResponse)
      .mockResolvedValueOnce(secondResponse);

    mockLLM.respond = respondFn;

    const reply = await engine.handleMessage({
      chatId: 'chat1',
      text: 'pedidos',
      authToken: 'valid-token',
    });

    expect(respondFn).toHaveBeenCalledTimes(2);
    expect(reply).toBe('Tenes 1 pedido pendiente.');
  });

  it('returns error when tool result has error', async () => {
    tools.register({
      name: 'ver_fail',
      description: 'Fails',
      inputSchema: { type: 'object', properties: {} },
      execute: async () => ({ error: 'No estas autenticado.' }),
    });

    mockLLM.respond = vi.fn(async () => ({
      text: '',
      toolCall: { name: 'ver_fail', params: {} },
    }));

    const reply = await engine.handleMessage({ chatId: 'chat1', text: 'test' });
    expect(reply).toContain('autenticado');
  });
});
```

- [ ] **Step 5: Delete old actions files**

```bash
rm src/actions/action.ts src/actions/dulcegestion.ts tests/actions/dulcegestion.test.ts
rmdir src/actions tests/actions
```

- [ ] **Step 6: Run all tests**

```bash
npx vitest run
```

Expected: All tests PASS (old action tests removed, new engine tests updated).

- [ ] **Step 7: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: replace actions with MCP tool registry in engine and claude adapter"
```

---

### Task 5: MCP stdio server

**Files:**
- Create: `src/mcp/server.ts`

- [ ] **Step 1: Install MCP SDK**

```bash
cd ~/working/webboost/dulcechat
npm install @modelcontextprotocol/sdk
```

- [ ] **Step 2: Implement MCP server**

Create `src/mcp/server.ts`:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ToolRegistry } from './registry.js';
import { ApiClient } from './api-client.js';
import { ordersTool } from './tools/orders.js';
import { stockTool } from './tools/stock.js';
import { customersTool } from './tools/customers.js';

const apiUrl = process.env.DULCEGESTION_API_URL ?? 'http://localhost:3001/api';
const authToken = process.env.DULCEGESTION_AUTH_TOKEN ?? '';

const api = new ApiClient(apiUrl);
const registry = new ToolRegistry();
registry.register(ordersTool(api));
registry.register(stockTool(api));
registry.register(customersTool(api));

const server = new McpServer({
  name: 'dulcegestion',
  version: '1.0.0',
});

for (const tool of registry.getAll()) {
  server.tool(
    tool.name,
    tool.description,
    tool.inputSchema as any,
    async (params: Record<string, unknown>) => {
      const result = await tool.execute(params, authToken);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[mcp] DulceGestion MCP server running on stdio');
}

main().catch(console.error);
```

- [ ] **Step 3: Add script to package.json**

Add to scripts in `package.json`:

```json
"mcp": "tsx src/mcp/server.ts"
```

- [ ] **Step 4: Verify it starts**

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1"}}}' | npx tsx src/mcp/server.ts 2>/dev/null | head -1
```

Expected: A JSON response with server capabilities.

- [ ] **Step 5: Commit**

```bash
git add src/mcp/server.ts package.json
git commit -m "feat: add MCP stdio server for Claude Desktop/Code"
```

---

## Summary

| Task | What it builds | Depends on |
|------|---------------|-----------|
| 1 | McpTool interface + ToolRegistry | - |
| 2 | Shared API client | - |
| 3 | Orders, stock, customers tools | 1, 2 |
| 4 | Wire into engine + Claude adapter | 1, 2, 3 |
| 5 | MCP stdio server | 1, 2, 3 |

Tasks 1 and 2 can run in parallel. Task 3 needs both. Tasks 4 and 5 are independent after Task 3.
