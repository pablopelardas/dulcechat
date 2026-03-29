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

  search(queryEmbedding: number[], topK = 3, queryText?: string): IndexedChunk[] {
    const scored = this.chunks.map((chunk) => {
      let score = cosineSimilarity(queryEmbedding, chunk.embedding);

      // Boost score with keyword matching for better results with simple embeddings
      if (queryText) {
        const normalize = (s: string) => s.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // strip accents
        const keywords = normalize(queryText).split(/\W+/).filter((w) => w.length > 2);
        const chunkNorm = normalize(chunk.text);
        const matches = keywords.filter((kw) => chunkNorm.includes(kw)).length;
        // Also boost if source filename matches a keyword
        const sourceNorm = normalize(chunk.source);
        const sourceMatch = keywords.some((kw) => sourceNorm.includes(kw)) ? 0.3 : 0;
        score += matches * 0.15 + sourceMatch;
      }

      return { chunk, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map((s) => s.chunk);
  }
}
