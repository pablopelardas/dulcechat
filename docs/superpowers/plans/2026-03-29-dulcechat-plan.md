# DulceChat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multi-channel chatbot for DulceGestion that answers support questions via RAG and queries live data via tool calling, with Telegram and web widget channels.

**Architecture:** Adapter pattern with three layers — channels (Telegram/Web), brain (engine + RAG + LLM), and actions (DulceGestion API). Each layer has swappable implementations behind shared interfaces.

**Tech Stack:** Node.js, TypeScript, telegraf, ws, express, @anthropic-ai/sdk, vitest

---

## File Structure

```
dulcechat/
  src/
    channels/
      channel.ts          # Channel interface + IncomingMessage/OutgoingMessage types
      telegram.ts         # Telegram adapter using telegraf
      web.ts              # WebSocket adapter for widget
    llm/
      llm.ts              # LLM interface + LLMRequest type
      hardcoded.ts        # Keyword-matching responder for testing
      claude.ts           # Claude API with tool calling
    rag/
      chunker.ts          # Split markdown files into chunks
      embeddings.ts       # Generate and load embeddings via Anthropic API
      retriever.ts        # Cosine similarity search
    actions/
      action.ts           # Action interface
      dulcegestion.ts     # API client for DulceGestion
    session/
      memory.ts           # In-memory session store with TTL
    engine.ts             # Core bot engine wiring everything together
    config.ts             # Environment config with dotenv
    index.ts              # Entry point
  docs/
    flows/                # Markdown docs for RAG indexing
  widget/
    index.html            # Chat widget served via iframe
    widget.js             # Embeddable script for DulceGestion
  data/                   # Persisted embeddings (gitignored)
  tests/
    session/
      memory.test.ts
    rag/
      chunker.test.ts
      retriever.test.ts
    llm/
      hardcoded.test.ts
    actions/
      dulcegestion.test.ts
    engine.test.ts
  package.json
  tsconfig.json
  .env.example
  .gitignore
```

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `src/config.ts`

- [ ] **Step 1: Initialize project**

```bash
cd ~/working/webboost/dulcechat
npm init -y
```

- [ ] **Step 2: Install dependencies**

```bash
npm install telegraf ws express @anthropic-ai/sdk dotenv
npm install -D typescript tsx vitest @types/node @types/ws @types/express
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
dist/
data/embeddings.json
.env
```

- [ ] **Step 5: Create .env.example**

```
TELEGRAM_TOKEN=
ANTHROPIC_API_KEY=
DULCEGESTION_API_URL=http://localhost:3001/api
SESSION_TTL_MINUTES=30
SESSION_MAX_HISTORY=20
WIDGET_ALLOWED_ORIGIN=http://localhost:5173
LLM_ADAPTER=hardcoded
PORT=3002
```

- [ ] **Step 6: Create src/config.ts**

```typescript
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  telegramToken: process.env.TELEGRAM_TOKEN ?? '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
  dulceGestionApiUrl: process.env.DULCEGESTION_API_URL ?? 'http://localhost:3001/api',
  sessionTtlMinutes: parseInt(process.env.SESSION_TTL_MINUTES ?? '30', 10),
  sessionMaxHistory: parseInt(process.env.SESSION_MAX_HISTORY ?? '20', 10),
  widgetAllowedOrigin: process.env.WIDGET_ALLOWED_ORIGIN ?? 'http://localhost:5173',
  llmAdapter: process.env.LLM_ADAPTER ?? 'hardcoded',
  port: parseInt(process.env.PORT ?? '3002', 10),
};
```

- [ ] **Step 7: Add scripts to package.json**

Add to the `scripts` section of `package.json`:

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "index-docs": "tsx src/rag/embeddings.ts"
  },
  "type": "module"
}
```

- [ ] **Step 8: Create .env from example**

```bash
cp .env.example .env
```

Then set your `TELEGRAM_TOKEN` in `.env`.

- [ ] **Step 9: Initialize git and commit**

```bash
cd ~/working/webboost/dulcechat
git init
git add package.json tsconfig.json .env.example .gitignore src/config.ts
git commit -m "chore: scaffold dulcechat project"
```

---

### Task 2: Session memory with TTL

**Files:**
- Create: `src/session/memory.ts`
- Create: `tests/session/memory.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/session/memory.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SessionStore, Session } from '../src/session/memory.js';

describe('SessionStore', () => {
  let store: SessionStore;

  beforeEach(() => {
    vi.useFakeTimers();
    store = new SessionStore({ ttlMinutes: 1, maxHistory: 3 });
  });

  afterEach(() => {
    store.destroy();
    vi.useRealTimers();
  });

  it('creates a new session for unknown chatId', () => {
    const session = store.get('chat1');
    expect(session.chatId).toBe('chat1');
    expect(session.history).toEqual([]);
  });

  it('returns the same session for the same chatId', () => {
    const s1 = store.get('chat1');
    s1.history.push({ role: 'user', content: 'hello' });
    const s2 = store.get('chat1');
    expect(s2.history).toHaveLength(1);
  });

  it('adds messages and trims history to maxHistory', () => {
    const session = store.get('chat1');
    store.addMessage('chat1', 'user', 'msg1');
    store.addMessage('chat1', 'assistant', 'reply1');
    store.addMessage('chat1', 'user', 'msg2');
    store.addMessage('chat1', 'assistant', 'reply2');
    expect(session.history).toHaveLength(3);
    expect(session.history[0].content).toBe('reply1');
  });

  it('expires sessions after TTL', () => {
    store.get('chat1');
    vi.advanceTimersByTime(2 * 60 * 1000); // 2 minutes
    store.cleanup();
    const session = store.get('chat1');
    expect(session.history).toEqual([]);
  });

  it('does not expire active sessions', () => {
    store.addMessage('chat1', 'user', 'hello');
    vi.advanceTimersByTime(30 * 1000); // 30 seconds
    store.cleanup();
    const session = store.get('chat1');
    expect(session.history).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd ~/working/webboost/dulcechat
npx vitest run tests/session/memory.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement SessionStore**

Create `src/session/memory.ts`:

```typescript
export interface Session {
  chatId: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  authToken?: string;
  lastActivity: number;
}

interface SessionStoreOptions {
  ttlMinutes: number;
  maxHistory: number;
}

export class SessionStore {
  private sessions = new Map<string, Session>();
  private ttlMs: number;
  private maxHistory: number;
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(options: SessionStoreOptions) {
    this.ttlMs = options.ttlMinutes * 60 * 1000;
    this.maxHistory = options.maxHistory;
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  get(chatId: string): Session {
    let session = this.sessions.get(chatId);
    if (!session) {
      session = { chatId, history: [], lastActivity: Date.now() };
      this.sessions.set(chatId, session);
    }
    return session;
  }

  addMessage(chatId: string, role: 'user' | 'assistant', content: string): void {
    const session = this.get(chatId);
    session.history.push({ role, content });
    if (session.history.length > this.maxHistory) {
      session.history = session.history.slice(-this.maxHistory);
    }
    session.lastActivity = Date.now();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [chatId, session] of this.sessions) {
      if (now - session.lastActivity > this.ttlMs) {
        this.sessions.delete(chatId);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.sessions.clear();
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/session/memory.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/session/memory.ts tests/session/memory.test.ts
git commit -m "feat: add session memory store with TTL"
```

---

### Task 3: Channel interface + Telegram adapter

**Files:**
- Create: `src/channels/channel.ts`
- Create: `src/channels/telegram.ts`

- [ ] **Step 1: Create Channel interface**

Create `src/channels/channel.ts`:

```typescript
export interface IncomingMessage {
  chatId: string;
  text: string;
  userId?: string;
  authToken?: string;
  meta?: Record<string, unknown>;
}

export interface OutgoingMessage {
  chatId: string;
  text: string;
}

export type MessageHandler = (msg: IncomingMessage) => Promise<string>;

export interface Channel {
  name: string;
  start(): Promise<void>;
  stop(): Promise<void>;
  onMessage(handler: MessageHandler): void;
}
```

- [ ] **Step 2: Implement Telegram adapter**

Create `src/channels/telegram.ts`:

```typescript
import { Telegraf } from 'telegraf';
import { Channel, IncomingMessage, MessageHandler } from './channel.js';

export class TelegramChannel implements Channel {
  name = 'telegram';
  private bot: Telegraf;
  private handler: MessageHandler | null = null;

  constructor(token: string) {
    this.bot = new Telegraf(token);
  }

  onMessage(handler: MessageHandler): void {
    this.handler = handler;
  }

  async start(): Promise<void> {
    this.bot.on('text', async (ctx) => {
      if (!this.handler) return;
      if (ctx.chat.type !== 'private') return;

      const incoming: IncomingMessage = {
        chatId: ctx.chat.id.toString(),
        text: ctx.message.text,
        userId: ctx.from.id.toString(),
        meta: { from: ctx.from.first_name },
      };

      const reply = await this.handler(incoming);
      await ctx.reply(reply);
    });

    this.bot.launch();
    console.log('[telegram] bot started');
  }

  async stop(): Promise<void> {
    this.bot.stop();
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/channels/channel.ts src/channels/telegram.ts
git commit -m "feat: add channel interface and telegram adapter"
```

---

### Task 4: LLM interface + hardcoded adapter

**Files:**
- Create: `src/llm/llm.ts`
- Create: `src/llm/hardcoded.ts`
- Create: `tests/llm/hardcoded.test.ts`

- [ ] **Step 1: Create LLM interface**

Create `src/llm/llm.ts`:

```typescript
export interface LLMRequest {
  message: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  context?: string;
  actionData?: string;
}

export interface LLMResponse {
  text: string;
  toolCall?: {
    name: string;
    params: Record<string, unknown>;
  };
}

export interface LLM {
  name: string;
  respond(req: LLMRequest): Promise<LLMResponse>;
}
```

- [ ] **Step 2: Write failing tests for hardcoded LLM**

Create `tests/llm/hardcoded.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { HardcodedLLM } from '../src/llm/hardcoded.js';

describe('HardcodedLLM', () => {
  const llm = new HardcodedLLM();

  it('responds to greetings', async () => {
    const res = await llm.respond({ message: 'hola', history: [] });
    expect(res.text).toContain('DulceChat');
  });

  it('responds to order-related keywords with tool call', async () => {
    const res = await llm.respond({ message: '¿qué pedidos tengo para mañana?', history: [] });
    expect(res.toolCall).toBeDefined();
    expect(res.toolCall!.name).toBe('ver_pedidos');
  });

  it('responds to stock-related keywords with tool call', async () => {
    const res = await llm.respond({ message: '¿cómo está mi stock?', history: [] });
    expect(res.toolCall).toBeDefined();
    expect(res.toolCall!.name).toBe('ver_stock');
  });

  it('responds to customer-related keywords with tool call', async () => {
    const res = await llm.respond({ message: 'buscar cliente María', history: [] });
    expect(res.toolCall).toBeDefined();
    expect(res.toolCall!.name).toBe('ver_clientes');
  });

  it('responds to help keywords with RAG context if provided', async () => {
    const res = await llm.respond({
      message: '¿cómo creo una receta?',
      history: [],
      context: 'Para crear una receta, ve a Produccion > Recetas > Nueva receta.',
    });
    expect(res.text).toContain('crear una receta');
  });

  it('returns fallback for unknown messages', async () => {
    const res = await llm.respond({ message: 'asdfghjkl', history: [] });
    expect(res.text.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run tests/llm/hardcoded.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 4: Implement HardcodedLLM**

Create `src/llm/hardcoded.ts`:

```typescript
import { LLM, LLMRequest, LLMResponse } from './llm.js';

const GREETINGS = ['hola', 'buenas', 'hey', 'hi', 'buenos dias', 'buenas tardes', 'buenas noches'];
const ORDER_KEYWORDS = ['pedido', 'pedidos', 'orden', 'ordenes', 'entrega', 'entregas'];
const STOCK_KEYWORDS = ['stock', 'ingrediente', 'ingredientes', 'inventario', 'despensa'];
const CUSTOMER_KEYWORDS = ['cliente', 'clientes', 'deudor', 'deudores'];

function matchesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

export class HardcodedLLM implements LLM {
  name = 'hardcoded';

  async respond(req: LLMRequest): Promise<LLMResponse> {
    const { message, context } = req;

    if (matchesAny(message, GREETINGS)) {
      return { text: '¡Hola! Soy DulceChat, tu asistente de DulceGestion. ¿En qué puedo ayudarte?' };
    }

    if (matchesAny(message, ORDER_KEYWORDS)) {
      return {
        text: 'Buscando tus pedidos...',
        toolCall: { name: 'ver_pedidos', params: {} },
      };
    }

    if (matchesAny(message, STOCK_KEYWORDS)) {
      return {
        text: 'Revisando tu inventario...',
        toolCall: { name: 'ver_stock', params: {} },
      };
    }

    if (matchesAny(message, CUSTOMER_KEYWORDS)) {
      return {
        text: 'Buscando clientes...',
        toolCall: { name: 'ver_clientes', params: {} },
      };
    }

    if (context) {
      return { text: `Segun la documentacion:\n\n${context}` };
    }

    return {
      text: 'No estoy seguro de como ayudarte con eso. Podes preguntarme sobre pedidos, stock, clientes, o como usar DulceGestion.',
    };
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run tests/llm/hardcoded.test.ts
```

Expected: All 6 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/llm/llm.ts src/llm/hardcoded.ts tests/llm/hardcoded.test.ts
git commit -m "feat: add LLM interface and hardcoded adapter"
```

---

### Task 5: Actions interface + DulceGestion API client

**Files:**
- Create: `src/actions/action.ts`
- Create: `src/actions/dulcegestion.ts`
- Create: `tests/actions/dulcegestion.test.ts`

- [ ] **Step 1: Create Action interface**

Create `src/actions/action.ts`:

```typescript
export interface Action {
  name: string;
  description: string;
  execute(params: Record<string, unknown>, authToken: string): Promise<string>;
}
```

- [ ] **Step 2: Write failing tests**

Create `tests/actions/dulcegestion.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DulceGestionActions } from '../src/actions/dulcegestion.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('DulceGestionActions', () => {
  const actions = new DulceGestionActions('http://localhost:3001/api');

  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('ver_pedidos calls GET /orders with auth header', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ id: 1, status: 'pending', delivery_date: '2026-03-30' }],
    });

    const action = actions.get('ver_pedidos')!;
    const result = await action.execute({}, 'test-token');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/orders'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      }),
    );
    expect(result).toContain('pedido');
  });

  it('ver_stock calls GET /ingredients with auth header', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ id: 1, name: 'Harina', stock: 5, unit: 'kg' }],
    });

    const action = actions.get('ver_stock')!;
    const result = await action.execute({}, 'test-token');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/ingredients'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      }),
    );
    expect(result).toContain('Harina');
  });

  it('ver_clientes calls GET /customers with auth header', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ id: 1, name: 'Maria Lopez', phone: '1234' }],
    });

    const action = actions.get('ver_clientes')!;
    const result = await action.execute({}, 'test-token');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/customers'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      }),
    );
    expect(result).toContain('Maria Lopez');
  });

  it('returns error message when API call fails', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401, statusText: 'Unauthorized' });

    const action = actions.get('ver_pedidos')!;
    const result = await action.execute({}, 'bad-token');

    expect(result).toContain('Error');
  });

  it('returns error message when no auth token', async () => {
    const action = actions.get('ver_pedidos')!;
    const result = await action.execute({}, '');

    expect(result).toContain('autenticado');
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run tests/actions/dulcegestion.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 4: Implement DulceGestionActions**

Create `src/actions/dulcegestion.ts`:

```typescript
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

    const lines = orders.slice(0, 10).map((o) => {
      const customer = o.customer?.name ?? 'Sin cliente';
      return `- Pedido #${o.id}: ${o.status} | ${customer} | Entrega: ${o.delivery_date}`;
    });

    const header = `Encontre ${orders.length} pedido${orders.length === 1 ? '' : 's'}:`;
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
      text += `\n\n⚠ Ingredientes con stock bajo:\n${lowLines.join('\n')}`;
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
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run tests/actions/dulcegestion.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/actions/action.ts src/actions/dulcegestion.ts tests/actions/dulcegestion.test.ts
git commit -m "feat: add actions interface and dulcegestion API client"
```

---

### Task 6: RAG — chunker and retriever

**Files:**
- Create: `src/rag/chunker.ts`
- Create: `src/rag/retriever.ts`
- Create: `src/rag/embeddings.ts`
- Create: `tests/rag/chunker.test.ts`
- Create: `tests/rag/retriever.test.ts`

- [ ] **Step 1: Write failing tests for chunker**

Create `tests/rag/chunker.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { chunkMarkdown, Chunk } from '../src/rag/chunker.js';

const SAMPLE_DOC = `# Como crear una receta

Para crear una receta, ve a Produccion > Recetas.

## Paso 1: Ingredientes

Selecciona los ingredientes y sus cantidades.

## Paso 2: Costos

El sistema calcula el costo automaticamente.

# Como crear un pedido

Ve a Principal > Pedidos > Nuevo pedido.

## Seleccionar cliente

Elige un cliente existente o crea uno nuevo.`;

describe('chunkMarkdown', () => {
  it('splits markdown by top-level headers', () => {
    const chunks = chunkMarkdown(SAMPLE_DOC, 'test.md');
    expect(chunks.length).toBe(2);
    expect(chunks[0].source).toBe('test.md');
  });

  it('preserves content within each chunk', () => {
    const chunks = chunkMarkdown(SAMPLE_DOC, 'test.md');
    expect(chunks[0].text).toContain('Produccion > Recetas');
    expect(chunks[0].text).toContain('Paso 1');
    expect(chunks[1].text).toContain('Seleccionar cliente');
  });

  it('includes the header in the chunk text', () => {
    const chunks = chunkMarkdown(SAMPLE_DOC, 'test.md');
    expect(chunks[0].text).toContain('Como crear una receta');
  });

  it('handles a document with no headers', () => {
    const chunks = chunkMarkdown('Just some plain text.', 'plain.md');
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe('Just some plain text.');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/rag/chunker.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement chunker**

Create `src/rag/chunker.ts`:

```typescript
export interface Chunk {
  text: string;
  source: string;
}

export function chunkMarkdown(content: string, source: string): Chunk[] {
  const lines = content.split('\n');
  const chunks: Chunk[] = [];
  let currentLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('# ') && currentLines.length > 0) {
      chunks.push({ text: currentLines.join('\n').trim(), source });
      currentLines = [line];
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0) {
    const text = currentLines.join('\n').trim();
    if (text) {
      chunks.push({ text, source });
    }
  }

  return chunks;
}
```

- [ ] **Step 4: Run chunker tests to verify they pass**

```bash
npx vitest run tests/rag/chunker.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Write failing tests for retriever**

Create `tests/rag/retriever.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { cosineSimilarity, Retriever, IndexedChunk } from '../src/rag/retriever.js';

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1);
  });

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it('returns -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1);
  });
});

describe('Retriever', () => {
  const chunks: IndexedChunk[] = [
    { text: 'Como crear una receta', source: 'recetas.md', embedding: [1, 0, 0] },
    { text: 'Como crear un pedido', source: 'pedidos.md', embedding: [0, 1, 0] },
    { text: 'Como ver el stock', source: 'stock.md', embedding: [0, 0, 1] },
  ];

  it('returns the most similar chunks', () => {
    const retriever = new Retriever(chunks);
    // Query embedding close to "receta" chunk
    const results = retriever.search([0.9, 0.1, 0], 2);
    expect(results).toHaveLength(2);
    expect(results[0].source).toBe('recetas.md');
  });

  it('respects the topK parameter', () => {
    const retriever = new Retriever(chunks);
    const results = retriever.search([1, 1, 1], 1);
    expect(results).toHaveLength(1);
  });
});
```

- [ ] **Step 6: Run tests to verify they fail**

```bash
npx vitest run tests/rag/retriever.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 7: Implement retriever**

Create `src/rag/retriever.ts`:

```typescript
export interface IndexedChunk {
  text: string;
  source: string;
  embedding: number[];
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export class Retriever {
  constructor(private chunks: IndexedChunk[]) {}

  search(queryEmbedding: number[], topK = 3): IndexedChunk[] {
    const scored = this.chunks.map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map((s) => s.chunk);
  }
}
```

- [ ] **Step 8: Run retriever tests to verify they pass**

```bash
npx vitest run tests/rag/retriever.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 9: Implement embeddings loader**

Create `src/rag/embeddings.ts`:

```typescript
import fs from 'fs/promises';
import path from 'path';
import { chunkMarkdown, Chunk } from './chunker.js';
import { IndexedChunk } from './retriever.js';

const DATA_DIR = path.resolve('data');
const EMBEDDINGS_FILE = path.join(DATA_DIR, 'embeddings.json');
const DOCS_DIR = path.resolve('docs', 'flows');

export async function loadEmbeddings(): Promise<IndexedChunk[]> {
  try {
    const data = await fs.readFile(EMBEDDINGS_FILE, 'utf-8');
    return JSON.parse(data) as IndexedChunk[];
  } catch {
    return [];
  }
}

export async function saveEmbeddings(chunks: IndexedChunk[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(EMBEDDINGS_FILE, JSON.stringify(chunks, null, 2));
}

export async function loadDocs(): Promise<Chunk[]> {
  try {
    const files = await fs.readdir(DOCS_DIR);
    const mdFiles = files.filter((f) => f.endsWith('.md'));
    const allChunks: Chunk[] = [];

    for (const file of mdFiles) {
      const content = await fs.readFile(path.join(DOCS_DIR, file), 'utf-8');
      const chunks = chunkMarkdown(content, file);
      allChunks.push(...chunks);
    }

    return allChunks;
  } catch {
    return [];
  }
}

export async function generateEmbeddings(apiKey: string): Promise<IndexedChunk[]> {
  const chunks = await loadDocs();
  if (chunks.length === 0) {
    console.log('No docs found in docs/flows/. Nothing to index.');
    return [];
  }

  // Dynamic import to avoid requiring the SDK when not using Claude
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey });

  console.log(`Indexing ${chunks.length} chunks...`);
  const indexed: IndexedChunk[] = [];

  for (const chunk of chunks) {
    // Use Voyage embeddings via Anthropic's API
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1,
      system: 'Respond with nothing.',
      messages: [{ role: 'user', content: chunk.text }],
    });

    // Placeholder: Anthropic doesn't have a direct embeddings endpoint yet.
    // We'll use a simple bag-of-words approach for now, and swap to Voyage/OpenAI later.
    const embedding = simpleEmbedding(chunk.text);
    indexed.push({ text: chunk.text, source: chunk.source, embedding });
  }

  await saveEmbeddings(indexed);
  console.log(`Saved ${indexed.length} embeddings to ${EMBEDDINGS_FILE}`);
  return indexed;
}

/**
 * Simple TF-based embedding for development/testing.
 * Will be replaced with Voyage embeddings when we connect Claude adapter.
 */
export function simpleEmbedding(text: string): number[] {
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);
  const vocab = new Map<string, number>();
  for (const word of words) {
    vocab.set(word, (vocab.get(word) ?? 0) + 1);
  }
  // Create a fixed-size vector by hashing words into buckets
  const size = 128;
  const vec = new Array(size).fill(0);
  for (const [word, count] of vocab) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash + word.charCodeAt(i)) | 0;
    }
    const idx = Math.abs(hash) % size;
    vec[idx] += count;
  }
  // Normalize
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < vec.length; i++) vec[i] /= norm;
  }
  return vec;
}

// CLI entry point: npm run index-docs
if (process.argv[1]?.endsWith('embeddings.ts') || process.argv[1]?.endsWith('embeddings.js')) {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
  loadDocs().then(async (chunks) => {
    console.log(`Found ${chunks.length} chunks from docs/flows/`);
    const indexed = chunks.map((c) => ({
      ...c,
      embedding: simpleEmbedding(c.text),
    }));
    await saveEmbeddings(indexed);
    console.log(`Saved ${indexed.length} embeddings (simple mode)`);
  });
}
```

- [ ] **Step 10: Commit**

```bash
git add src/rag/ tests/rag/
git commit -m "feat: add RAG system with chunker, retriever, and embeddings"
```

---

### Task 7: Bot engine

**Files:**
- Create: `src/engine.ts`
- Create: `tests/engine.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/engine.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BotEngine } from '../src/engine.js';
import { LLM, LLMRequest, LLMResponse } from '../src/llm/llm.js';
import { Retriever, IndexedChunk } from '../src/rag/retriever.js';
import { DulceGestionActions } from '../src/actions/dulcegestion.js';
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

  beforeEach(() => {
    mockLLM = createMockLLM({ text: 'Hello from bot' });
    sessions = new SessionStore({ ttlMinutes: 30, maxHistory: 20 });
    const chunks: IndexedChunk[] = [];
    const retriever = new Retriever(chunks);
    const actions = new DulceGestionActions('http://localhost:3001/api');

    engine = new BotEngine(mockLLM, retriever, actions, sessions);
  });

  afterEach(() => {
    sessions.destroy();
  });

  it('processes a simple message and returns response', async () => {
    const reply = await engine.handleMessage({
      chatId: 'chat1',
      text: 'hola',
    });
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
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 1, status: 'pending', delivery_date: '2026-03-30' }],
    });
    vi.stubGlobal('fetch', mockFetch);

    const firstResponse: LLMResponse = {
      text: 'Buscando...',
      toolCall: { name: 'ver_pedidos', params: {} },
    };
    const secondResponse: LLMResponse = { text: 'Tenes 1 pedido pendiente.' };

    const respondFn = vi.fn()
      .mockResolvedValueOnce(firstResponse)
      .mockResolvedValueOnce(secondResponse);

    mockLLM.respond = respondFn;

    const reply = await engine.handleMessage({
      chatId: 'chat1',
      text: 'pedidos para mañana',
      authToken: 'valid-token',
    });

    expect(respondFn).toHaveBeenCalledTimes(2);
    expect(reply).toBe('Tenes 1 pedido pendiente.');

    vi.unstubAllGlobals();
  });

  it('returns tool call text when no auth token and action requested', async () => {
    const response: LLMResponse = {
      text: 'Buscando...',
      toolCall: { name: 'ver_pedidos', params: {} },
    };
    mockLLM.respond = vi.fn(async () => response);

    const reply = await engine.handleMessage({
      chatId: 'chat1',
      text: 'pedidos',
    });

    expect(reply).toContain('autenticado');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/engine.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement BotEngine**

Create `src/engine.ts`:

```typescript
import { IncomingMessage } from './channels/channel.js';
import { LLM } from './llm/llm.js';
import { Retriever } from './rag/retriever.js';
import { simpleEmbedding } from './rag/embeddings.js';
import { DulceGestionActions } from './actions/dulcegestion.js';
import { SessionStore } from './session/memory.js';

export class BotEngine {
  constructor(
    private llm: LLM,
    private retriever: Retriever,
    private actions: DulceGestionActions,
    private sessions: SessionStore,
  ) {}

  async handleMessage(msg: IncomingMessage): Promise<string> {
    const session = this.sessions.get(msg.chatId);

    if (msg.authToken) {
      session.authToken = msg.authToken;
    }

    // Search for relevant documentation
    const queryEmbedding = simpleEmbedding(msg.text);
    const relevantChunks = this.retriever.search(queryEmbedding, 3);
    const context = relevantChunks.length > 0
      ? relevantChunks.map((c) => c.text).join('\n\n---\n\n')
      : undefined;

    // First LLM call
    this.sessions.addMessage(msg.chatId, 'user', msg.text);
    let response = await this.llm.respond({
      message: msg.text,
      history: session.history.slice(0, -1), // exclude the message we just added
      context,
    });

    // If LLM wants to call a tool, execute it
    if (response.toolCall) {
      const authToken = session.authToken ?? '';
      const action = this.actions.get(response.toolCall.name);

      if (!action) {
        const reply = `No conozco la accion "${response.toolCall.name}".`;
        this.sessions.addMessage(msg.chatId, 'assistant', reply);
        return reply;
      }

      const actionResult = await action.execute(response.toolCall.params, authToken);

      // If no auth token and action needs one
      if (actionResult.includes('autenticado')) {
        this.sessions.addMessage(msg.chatId, 'assistant', actionResult);
        return actionResult;
      }

      // Second LLM call with action data
      response = await this.llm.respond({
        message: msg.text,
        history: session.history.slice(0, -1),
        context,
        actionData: actionResult,
      });
    }

    this.sessions.addMessage(msg.chatId, 'assistant', response.text);
    return response.text;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/engine.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine.ts tests/engine.test.ts
git commit -m "feat: add bot engine connecting LLM, RAG, actions, and sessions"
```

---

### Task 8: Entry point and Telegram integration test

**Files:**
- Create: `src/index.ts`

- [ ] **Step 1: Create index.ts**

Create `src/index.ts`:

```typescript
import { config } from './config.js';
import { SessionStore } from './session/memory.js';
import { TelegramChannel } from './channels/telegram.js';
import { HardcodedLLM } from './llm/hardcoded.js';
import { Retriever, IndexedChunk } from './rag/retriever.js';
import { loadEmbeddings } from './rag/embeddings.js';
import { DulceGestionActions } from './actions/dulcegestion.js';
import { BotEngine } from './engine.js';

async function main() {
  console.log('Starting DulceChat...');

  // Load embeddings (empty array if not yet indexed)
  const chunks: IndexedChunk[] = await loadEmbeddings();
  console.log(`Loaded ${chunks.length} document chunks`);

  // Initialize components
  const sessions = new SessionStore({
    ttlMinutes: config.sessionTtlMinutes,
    maxHistory: config.sessionMaxHistory,
  });

  const retriever = new Retriever(chunks);
  const actions = new DulceGestionActions(config.dulceGestionApiUrl);

  // Select LLM adapter
  const llm = config.llmAdapter === 'claude'
    ? await createClaudeLLM()
    : new HardcodedLLM();

  console.log(`Using LLM adapter: ${llm.name}`);

  const engine = new BotEngine(llm, retriever, actions, sessions);

  // Start channels
  const channels = [];

  if (config.telegramToken) {
    const telegram = new TelegramChannel(config.telegramToken);
    telegram.onMessage((msg) => engine.handleMessage(msg));
    await telegram.start();
    channels.push(telegram);
  }

  console.log(`DulceChat running with ${channels.length} channel(s)`);

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\nShutting down...');
    for (const ch of channels) {
      await ch.stop();
    }
    sessions.destroy();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

async function createClaudeLLM() {
  const { ClaudeLLM } = await import('./llm/claude.js');
  return new ClaudeLLM(config.anthropicApiKey);
}

main().catch(console.error);
```

- [ ] **Step 2: Run the bot locally**

```bash
cd ~/working/webboost/dulcechat
npm run dev
```

Expected: Console shows:
```
Starting DulceChat...
Loaded 0 document chunks
Using LLM adapter: hardcoded
[telegram] bot started
DulceChat running with 1 channel(s)
```

- [ ] **Step 3: Test manually in Telegram**

Open Telegram, find your bot, and send:
- "hola" → should reply with greeting
- "pedidos" → should reply with "Buscando tus pedidos..." (no auth, may show auth error)
- "asdfgh" → should reply with fallback message

- [ ] **Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: add entry point with telegram channel"
```

---

### Task 9: Documentation for RAG

**Files:**
- Create: `docs/flows/recetas.md`
- Create: `docs/flows/pedidos.md`
- Create: `docs/flows/stock.md`
- Create: `docs/flows/clientes.md`
- Create: `docs/flows/venta-rapida.md`
- Create: `docs/flows/catalogo.md`

- [ ] **Step 1: Create docs directory**

```bash
mkdir -p ~/working/webboost/dulcechat/docs/flows
```

- [ ] **Step 2: Create recetas.md**

Create `docs/flows/recetas.md`:

```markdown
# Como crear una receta

Para crear una receta en DulceGestion:

1. Ir a Produccion > Recetas en el menu lateral
2. Hacer clic en "Nueva receta"
3. Escribir el nombre de la receta
4. Agregar ingredientes: buscar cada ingrediente, indicar la cantidad necesaria
5. Opcionalmente agregar costo de mano de obra y porcentaje de ganancia
6. El sistema calcula automaticamente el costo total y precio sugerido
7. Opcionalmente agregar instrucciones de preparacion (texto enriquecido) e imagenes
8. Guardar la receta

El costo de la receta se actualiza automaticamente cuando cambia el precio de un ingrediente.

Se pueden crear sub-recetas (una receta que usa otra receta como ingrediente), ideal para bases, cremas, o rellenos que se reutilizan.

Para duplicar una receta existente, abrir la receta y usar el boton "Duplicar".

# Como editar una receta

1. Ir a Produccion > Recetas
2. Hacer clic en la receta que se quiere editar
3. Modificar lo necesario (ingredientes, cantidades, instrucciones)
4. Guardar los cambios

Los cambios de costo se reflejan automaticamente en todos los productos que usen esa receta.
```

- [ ] **Step 3: Create pedidos.md**

Create `docs/flows/pedidos.md`:

```markdown
# Como crear un pedido

Para crear un pedido nuevo:

1. Ir a Principal > Pedidos
2. Hacer clic en "Nuevo pedido"
3. Seleccionar un cliente (o crear uno nuevo)
4. Agregar items: elegir recetas o productos, indicar cantidad
5. Opcionalmente ajustar precio o aplicar codigo de descuento
6. Establecer fecha de entrega
7. Opcionalmente registrar un pago parcial (sena)
8. Guardar el pedido

# Estados de un pedido

Los pedidos tienen estos estados:
- **Pendiente**: pedido creado, sin empezar a preparar
- **En preparacion**: se esta cocinando/armando
- **Listo**: terminado, esperando entrega
- **Entregado**: entregado al cliente
- **Cancelado**: pedido cancelado

Para cambiar el estado, abrir el pedido y usar los botones de estado.

# Como ver pedidos pendientes

Ir a Principal > Pedidos. Se pueden filtrar por:
- Fecha de entrega
- Estado (pendiente, en preparacion, listo, etc.)

El dashboard principal muestra los pedidos proximos a entregar.

# Pagos de pedidos

Cada pedido puede tener multiples pagos parciales. Para registrar un pago:
1. Abrir el pedido
2. Ir a la seccion de pagos
3. Ingresar monto, metodo de pago (efectivo, transferencia, MercadoPago) y fecha
4. Guardar

El sistema muestra si el pedido esta: Sin pagar, Pago parcial, o Pagado.
```

- [ ] **Step 4: Create stock.md**

Create `docs/flows/stock.md`:

```markdown
# Como gestionar el stock de ingredientes

## Ver stock actual

Ir a Produccion > Mi Despensa. Se ven todos los ingredientes con su stock actual y unidad.

## Agregar un ingrediente

1. Ir a Mi Despensa
2. Hacer clic en "Nuevo ingrediente"
3. Completar: nombre, unidad (kg, litros, unidades), precio por unidad, stock actual
4. Opcionalmente establecer un umbral de stock bajo (para recibir alertas)
5. Guardar

## Actualizar stock

El stock se actualiza automaticamente cuando:
- Se registra una compra (suma stock)
- Se marca un pedido como listo (resta stock segun los ingredientes de las recetas)
- Se hace una venta rapida (resta stock)

Para ajuste manual: ir al ingrediente y modificar el stock directamente.

## Alertas de stock bajo

Si un ingrediente tiene configurado un umbral y el stock cae por debajo, aparece una alerta en el dashboard. Tambien se puede ver la lista completa en Gestion > Faltantes.

# Lista de compras

Ir a Gestion > Faltantes para ver que ingredientes necesitas comprar basado en los pedidos pendientes. El sistema calcula automaticamente las cantidades necesarias.
```

- [ ] **Step 5: Create clientes.md**

Create `docs/flows/clientes.md`:

```markdown
# Como gestionar clientes

## Ver clientes

Ir a Principal > Clientes. Se ve la lista de todos los clientes con nombre, telefono y saldo pendiente.

## Agregar un cliente

1. Hacer clic en "Nuevo cliente"
2. Completar: nombre (obligatorio), telefono, direccion, notas
3. Guardar

## Ver historial de un cliente

Hacer clic en un cliente para ver:
- Todos sus pedidos (historial completo)
- Su cuenta corriente (saldo, pagos realizados)
- Sus productos favoritos (los que mas pidio)
- Eventos (cumpleanos, aniversarios)

## Cuenta corriente

Cada cliente tiene un saldo que refleja cuanto debe. Se puede registrar un pago a cuenta desde la ficha del cliente, y el sistema lo distribuye automaticamente a los pedidos mas antiguos (FIFO).

## Portal del cliente

Se puede generar un link magico para que el cliente acceda a su portal, donde ve sus pedidos y puede repetir pedidos anteriores. El link se envia por WhatsApp.
```

- [ ] **Step 6: Create venta-rapida.md**

Create `docs/flows/venta-rapida.md`:

```markdown
# Como hacer una venta rapida

La venta rapida es como una caja registradora para ventas directas sin crear un pedido formal.

1. Ir a Principal > Venta Rapida
2. Buscar y seleccionar el producto
3. Indicar cantidad
4. Opcionalmente aplicar descuento
5. Seleccionar metodo de pago (efectivo, transferencia, MercadoPago, tarjeta)
6. Confirmar la venta

El sistema automaticamente:
- Descuenta el stock del producto
- Registra la venta en el resumen del dia
- Permite imprimir un ticket de 80mm

## Cierre de caja

Al final del dia, se puede ver el resumen de todas las ventas rapidas con el total por metodo de pago.
```

- [ ] **Step 7: Create catalogo.md**

Create `docs/flows/catalogo.md`:

```markdown
# Como configurar el catalogo publico

El catalogo es una pagina publica donde tus clientes pueden ver tus productos y hacer pedidos.

## Activar el catalogo

1. Ir a Configuracion
2. En la seccion "Catalogo", activar la opcion
3. Elegir un slug (URL personalizada): dulcegestion.ar/catalog/tu-nombre
4. Elegir el layout: grilla, menu, o revista
5. Personalizar colores y logo
6. Guardar

## Agregar productos al catalogo

Solo los productos marcados como "visible en catalogo" aparecen. Para cada producto:
1. Editar el producto
2. Activar "Mostrar en catalogo"
3. Asegurarse de tener imagen y descripcion cargadas
4. Guardar

## Pedidos desde el catalogo

Cuando un cliente hace un pedido desde el catalogo:
1. Aparece en Principal > Pedidos con origen "catalogo"
2. Se puede aceptar (asignando un cliente existente o creando uno nuevo) o rechazar
3. Una vez aceptado, se gestiona como cualquier otro pedido
```

- [ ] **Step 8: Index the docs**

```bash
cd ~/working/webboost/dulcechat
npm run index-docs
```

Expected: Console shows chunks found and saved.

- [ ] **Step 9: Commit**

```bash
git add docs/flows/
git commit -m "docs: add DulceGestion user flows for RAG indexing"
```

---

### Task 10: Web widget channel

**Files:**
- Create: `src/channels/web.ts`
- Create: `widget/index.html`
- Create: `widget/widget.js`
- Modify: `src/index.ts`

- [ ] **Step 1: Implement WebSocket channel**

Create `src/channels/web.ts`:

```typescript
import { WebSocketServer } from 'ws';
import { Channel, IncomingMessage, MessageHandler } from './channel.js';

interface WebSocketMessage {
  text: string;
  authToken?: string;
}

export class WebChannel implements Channel {
  name = 'web';
  private wss: WebSocketServer | null = null;
  private handler: MessageHandler | null = null;

  constructor(private port: number, private allowedOrigin: string) {}

  onMessage(handler: MessageHandler): void {
    this.handler = handler;
  }

  async start(): Promise<void> {
    // WSS will be attached to the Express server, not standalone
    // This is initialized by the index.ts when setting up Express
  }

  attachToServer(server: import('http').Server): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws, req) => {
      const origin = req.headers.origin ?? '';
      if (this.allowedOrigin !== '*' && !origin.includes(this.allowedOrigin)) {
        ws.close(1008, 'Origin not allowed');
        return;
      }

      const chatId = `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      let authToken: string | undefined;

      ws.on('message', async (data) => {
        if (!this.handler) return;

        try {
          const parsed: WebSocketMessage = JSON.parse(data.toString());

          if (parsed.authToken) {
            authToken = parsed.authToken;
          }

          const incoming: IncomingMessage = {
            chatId,
            text: parsed.text,
            authToken,
          };

          const reply = await this.handler(incoming);
          ws.send(JSON.stringify({ text: reply }));
        } catch {
          ws.send(JSON.stringify({ text: 'Error procesando tu mensaje.' }));
        }
      });
    });

    console.log('[web] websocket channel ready on /ws');
  }

  async stop(): Promise<void> {
    this.wss?.close();
  }
}
```

- [ ] **Step 2: Create widget HTML**

Create `widget/index.html`:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DulceChat</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: #fff;
    }
    .header {
      background: #ec4899;
      color: white;
      padding: 12px 16px;
      font-weight: 600;
      font-size: 14px;
    }
    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .message {
      max-width: 80%;
      padding: 8px 12px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.4;
      white-space: pre-wrap;
    }
    .message.user {
      align-self: flex-end;
      background: #ec4899;
      color: white;
      border-bottom-right-radius: 4px;
    }
    .message.assistant {
      align-self: flex-start;
      background: #f3f4f6;
      color: #1f2937;
      border-bottom-left-radius: 4px;
    }
    .input-area {
      display: flex;
      padding: 12px;
      border-top: 1px solid #e5e7eb;
      gap: 8px;
    }
    .input-area input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 20px;
      outline: none;
      font-size: 14px;
    }
    .input-area input:focus { border-color: #ec4899; }
    .input-area button {
      background: #ec4899;
      color: white;
      border: none;
      border-radius: 20px;
      padding: 8px 16px;
      cursor: pointer;
      font-size: 14px;
    }
    .input-area button:hover { background: #db2777; }
    .input-area button:disabled { background: #d1d5db; cursor: default; }
  </style>
</head>
<body>
  <div class="header">DulceChat</div>
  <div class="messages" id="messages">
    <div class="message assistant">Hola! Soy DulceChat. ¿En que puedo ayudarte?</div>
  </div>
  <div class="input-area">
    <input type="text" id="input" placeholder="Escribi tu mensaje..." autocomplete="off">
    <button id="send">Enviar</button>
  </div>

  <script>
    const messages = document.getElementById('messages');
    const input = document.getElementById('input');
    const sendBtn = document.getElementById('send');

    // Get auth token from parent window
    const params = new URLSearchParams(window.location.search);
    const authToken = params.get('token') || '';

    // Connect WebSocket
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws`);

    // Send auth token on connect
    ws.onopen = () => {
      if (authToken) {
        ws.send(JSON.stringify({ text: '__auth__', authToken }));
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      addMessage(data.text, 'assistant');
      sendBtn.disabled = false;
    };

    function addMessage(text, role) {
      const div = document.createElement('div');
      div.className = `message ${role}`;
      div.textContent = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    function send() {
      const text = input.value.trim();
      if (!text) return;
      addMessage(text, 'user');
      ws.send(JSON.stringify({ text, authToken }));
      input.value = '';
      sendBtn.disabled = true;
    }

    sendBtn.addEventListener('click', send);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') send();
    });
  </script>
</body>
</html>
```

- [ ] **Step 3: Create embeddable widget script**

Create `widget/widget.js`:

```javascript
(function() {
  const script = document.currentScript;
  const token = script?.getAttribute('data-token') || '';
  const botUrl = script?.src ? new URL(script.src).origin : '';

  // Create bubble button
  const bubble = document.createElement('div');
  bubble.innerHTML = '💬';
  bubble.style.cssText = 'position:fixed;bottom:20px;right:20px;width:56px;height:56px;background:#ec4899;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:24px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:9999;transition:transform 0.2s;';
  bubble.onmouseenter = () => bubble.style.transform = 'scale(1.1)';
  bubble.onmouseleave = () => bubble.style.transform = 'scale(1)';

  // Create iframe container
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;bottom:88px;right:20px;width:380px;height:520px;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.2);z-index:9999;display:none;';

  const iframe = document.createElement('iframe');
  iframe.src = `${botUrl}/widget/chat?token=${encodeURIComponent(token)}`;
  iframe.style.cssText = 'width:100%;height:100%;border:none;';
  container.appendChild(iframe);

  let open = false;
  bubble.addEventListener('click', () => {
    open = !open;
    container.style.display = open ? 'block' : 'none';
    bubble.innerHTML = open ? '✕' : '💬';
  });

  document.body.appendChild(container);
  document.body.appendChild(bubble);
})();
```

- [ ] **Step 4: Update index.ts to add Express and web channel**

Replace the contents of `src/index.ts`:

```typescript
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { config } from './config.js';
import { SessionStore } from './session/memory.js';
import { TelegramChannel } from './channels/telegram.js';
import { WebChannel } from './channels/web.js';
import { HardcodedLLM } from './llm/hardcoded.js';
import { Retriever, IndexedChunk } from './rag/retriever.js';
import { loadEmbeddings } from './rag/embeddings.js';
import { DulceGestionActions } from './actions/dulcegestion.js';
import { BotEngine } from './engine.js';

async function main() {
  console.log('Starting DulceChat...');

  const chunks: IndexedChunk[] = await loadEmbeddings();
  console.log(`Loaded ${chunks.length} document chunks`);

  const sessions = new SessionStore({
    ttlMinutes: config.sessionTtlMinutes,
    maxHistory: config.sessionMaxHistory,
  });

  const retriever = new Retriever(chunks);
  const actions = new DulceGestionActions(config.dulceGestionApiUrl);

  const llm = config.llmAdapter === 'claude'
    ? await createClaudeLLM()
    : new HardcodedLLM();

  console.log(`Using LLM adapter: ${llm.name}`);

  const engine = new BotEngine(llm, retriever, actions, sessions);

  const channels: { stop(): Promise<void> }[] = [];

  // Express server for widget and health
  const app = express();
  const server = createServer(app);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // Serve widget files
  const widgetDir = path.resolve('widget');
  app.use('/widget', express.static(widgetDir));
  app.get('/widget/chat', (_req, res) => {
    res.sendFile(path.join(widgetDir, 'index.html'));
  });
  app.get('/widget.js', (_req, res) => {
    res.sendFile(path.join(widgetDir, 'widget.js'));
  });

  // Web channel (WebSocket)
  const web = new WebChannel(config.port, config.widgetAllowedOrigin);
  web.onMessage((msg) => engine.handleMessage(msg));
  web.attachToServer(server);
  channels.push(web);

  // Telegram channel
  if (config.telegramToken) {
    const telegram = new TelegramChannel(config.telegramToken);
    telegram.onMessage((msg) => engine.handleMessage(msg));
    await telegram.start();
    channels.push(telegram);
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

async function createClaudeLLM() {
  const { ClaudeLLM } = await import('./llm/claude.js');
  return new ClaudeLLM(config.anthropicApiKey);
}

main().catch(console.error);
```

- [ ] **Step 5: Test locally**

```bash
npm run dev
```

Then open `http://localhost:3002/widget/chat` in the browser. Type "hola" and verify you get a response.

- [ ] **Step 6: Commit**

```bash
git add src/channels/web.ts src/index.ts widget/
git commit -m "feat: add web widget channel with websocket and embeddable script"
```

---

### Task 11: Claude LLM adapter with tool calling

**Files:**
- Create: `src/llm/claude.ts`

- [ ] **Step 1: Implement Claude adapter**

Create `src/llm/claude.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { LLM, LLMRequest, LLMResponse } from './llm.js';

const SYSTEM_PROMPT = `Sos DulceChat, el asistente virtual de DulceGestion, una aplicacion de gestion para pastelerias y emprendimientos de reposteria.

Tu rol es:
- Responder preguntas sobre como usar la aplicacion
- Consultar datos del negocio (pedidos, stock, clientes) cuando el usuario lo pida
- Ser amable, conciso y hablar en espanol rioplatense

Si el usuario pregunta algo sobre la app y tenes contexto de documentacion, usa esa informacion para responder.
Si el usuario pide datos del negocio, usa las herramientas disponibles.
Si no sabes algo, decilo honestamente.`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'ver_pedidos',
    description: 'Consultar pedidos del negocio. Puede filtrar por fecha y estado.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', description: 'Estado: pending, delivered, cancelled' },
        startDate: { type: 'string', description: 'Fecha inicio ISO (YYYY-MM-DD)' },
        endDate: { type: 'string', description: 'Fecha fin ISO (YYYY-MM-DD)' },
      },
    },
  },
  {
    name: 'ver_stock',
    description: 'Ver stock actual de ingredientes y detectar faltantes.',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'ver_clientes',
    description: 'Buscar y listar clientes del negocio.',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
];

export class ClaudeLLM implements LLM {
  name = 'claude';
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async respond(req: LLMRequest): Promise<LLMResponse> {
    const systemParts: string[] = [SYSTEM_PROMPT];

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

    const response = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemParts.join('\n'),
      tools: TOOLS,
      messages,
    });

    // Check if Claude wants to use a tool
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

    // Extract text response
    const textBlock = response.content.find((block) => block.type === 'text');
    return {
      text: textBlock && textBlock.type === 'text' ? textBlock.text : 'No pude generar una respuesta.',
    };
  }
}
```

- [ ] **Step 2: Test manually**

Set `LLM_ADAPTER=claude` and your `ANTHROPIC_API_KEY` in `.env`, then:

```bash
npm run dev
```

In Telegram or the widget, send: "hola, como cargo una receta?" and verify Claude responds using the RAG context.

Send: "que pedidos tengo?" and verify Claude calls the `ver_pedidos` tool (will fail without DulceGestion running, which is expected).

- [ ] **Step 3: Commit**

```bash
git add src/llm/claude.ts
git commit -m "feat: add Claude LLM adapter with tool calling"
```

---

## Summary

| Task | What it builds | Depends on |
|------|---------------|-----------|
| 1 | Project scaffold | - |
| 2 | Session memory with TTL | 1 |
| 3 | Channel interface + Telegram | 1 |
| 4 | LLM interface + hardcoded adapter | 1 |
| 5 | Actions + DulceGestion API client | 1 |
| 6 | RAG (chunker + retriever + embeddings) | 1 |
| 7 | Bot engine | 2, 4, 5, 6 |
| 8 | Entry point + Telegram test | 3, 7 |
| 9 | Documentation for RAG | 6 |
| 10 | Web widget channel | 7, 8 |
| 11 | Claude LLM adapter | 4, 7 |

After Task 8 you have a working bot on Telegram with hardcoded responses. Tasks 9-11 add RAG, web widget, and Claude — each independently testable.
