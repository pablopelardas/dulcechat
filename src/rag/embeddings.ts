import fs from 'fs/promises';
import path from 'path';
import { chunkMarkdown, Chunk } from './chunker.js';
import { IndexedChunk } from './retriever.js';
import { config } from '../config.js';

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
 * Voyage AI embedding — batches multiple texts in a single API call.
 * Returns one embedding vector per input text.
 */
export async function voyageEmbedding(texts: string[], apiKey: string): Promise<number[][]> {
  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: texts, model: 'voyage-3-lite' }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Voyage API error ${response.status}: ${body}`);
  }

  const json = await response.json() as { data: { embedding: number[] }[] };
  return json.data.map((d) => d.embedding);
}

// Simple LRU cache for query embeddings
const queryCache = new Map<string, number[]>();
const CACHE_MAX_SIZE = 100;

/**
 * Get a single query embedding.
 * Uses Voyage when an API key is configured, falls back to simpleEmbedding.
 * Caches results to avoid repeated API calls for the same/similar queries.
 */
export async function getQueryEmbedding(text: string): Promise<number[]> {
  const key = text.toLowerCase().trim();

  const cached = queryCache.get(key);
  if (cached) {
    return cached;
  }

  let embedding: number[];
  if (config.voyageApiKey) {
    [embedding] = await voyageEmbedding([text], config.voyageApiKey);
  } else {
    embedding = simpleEmbedding(text);
  }

  // Evict oldest if full
  if (queryCache.size >= CACHE_MAX_SIZE) {
    const oldest = queryCache.keys().next().value!;
    queryCache.delete(oldest);
  }
  queryCache.set(key, embedding);

  return embedding;
}

/**
 * Simple TF-based embedding for development/testing.
 * Kept as fallback when no Voyage API key is configured.
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

    let embeddings: number[][];
    if (config.voyageApiKey) {
      console.log('Using Voyage AI embeddings (voyage-3-lite)...');
      const texts = chunks.map((c) => c.text);
      // Voyage free tier: 3 RPM / 10K TPM — batch in groups of 20 with delays
      const BATCH_SIZE = 20;
      const BATCH_DELAY_MS = 22000; // ~22s between batches to stay under 3 RPM
      embeddings = [];
      for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE);
        if (i > 0) {
          console.log(`  Waiting ${BATCH_DELAY_MS / 1000}s before next batch (rate limit)...`);
          await new Promise((res) => setTimeout(res, BATCH_DELAY_MS));
        }
        console.log(`  Embedding chunks ${i + 1}–${Math.min(i + BATCH_SIZE, texts.length)} of ${texts.length}...`);
        const batchEmbeddings = await voyageEmbedding(batch, config.voyageApiKey);
        embeddings.push(...batchEmbeddings);
      }
      console.log(`Generated ${embeddings.length} Voyage embeddings`);
    } else {
      console.log('No VOYAGE_API_KEY found — using simple hash embeddings (fallback)');
      embeddings = chunks.map((c) => simpleEmbedding(c.text));
    }

    const indexed: IndexedChunk[] = chunks.map((c, i) => ({
      ...c,
      embedding: embeddings[i],
    }));

    await saveEmbeddings(indexed);
    console.log(`Saved ${indexed.length} embeddings (${config.voyageApiKey ? 'Voyage AI' : 'simple'} mode)`);
  });
}
