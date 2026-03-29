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
    // Stub fetch to intercept Voyage API calls so tests don't hit the real network
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => {
      if (String(url).includes('voyageai.com')) {
        return {
          ok: true,
          json: async () => ({ data: [{ embedding: new Array(1024).fill(0) }] }),
        };
      }
      return { ok: false, status: 500, text: async () => 'Unexpected fetch call', json: async () => ({}) };
    }));

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
    vi.unstubAllGlobals();
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
