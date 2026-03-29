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

  it('returns auth error when no auth token and action requested', async () => {
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
