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
  const norm = Math.sqrt(vec.reduce((s: number, v: number) => s + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < vec.length; i++) vec[i] /= norm;
  }
  return vec;
}

// CLI entry point: npm run index-docs
if (process.argv[1]?.endsWith('embeddings.ts') || process.argv[1]?.endsWith('embeddings.js')) {
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
