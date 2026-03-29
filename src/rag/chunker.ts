export interface Chunk {
  text: string;
  source: string;
}

export function chunkMarkdown(content: string, source: string): Chunk[] {
  const lines = content.split('\n');
  const chunks: Chunk[] = [];
  let currentLines: string[] = [];

  for (const line of lines) {
    // Split on ## headers (not just #) to get smaller, focused chunks
    if (/^#{1,2} /.test(line) && currentLines.length > 0) {
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
