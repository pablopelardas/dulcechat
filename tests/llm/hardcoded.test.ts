import { describe, it, expect } from 'vitest';
import { HardcodedLLM } from '../../src/llm/hardcoded.js';

describe('HardcodedLLM', () => {
  const llm = new HardcodedLLM();

  it('responds to greetings', async () => {
    const res = await llm.respond({ message: 'hola', history: [] });
    expect(res.text).toContain('Caramelo');
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
