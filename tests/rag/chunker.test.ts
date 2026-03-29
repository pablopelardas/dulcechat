import { describe, it, expect } from 'vitest';
import { chunkMarkdown, Chunk } from '../../src/rag/chunker.js';

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
  it('splits markdown by h1 and h2 headers', () => {
    const chunks = chunkMarkdown(SAMPLE_DOC, 'test.md');
    // # Como crear una receta, ## Paso 1, ## Paso 2, # Como crear un pedido, ## Seleccionar cliente
    expect(chunks.length).toBe(5);
    expect(chunks[0].source).toBe('test.md');
  });

  it('preserves content within each chunk', () => {
    const chunks = chunkMarkdown(SAMPLE_DOC, 'test.md');
    expect(chunks[0].text).toContain('Produccion > Recetas');
    expect(chunks[4].text).toContain('Elige un cliente');
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
