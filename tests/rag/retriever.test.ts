import { describe, it, expect } from 'vitest';
import { cosineSimilarity, Retriever, IndexedChunk } from '../../src/rag/retriever.js';

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
