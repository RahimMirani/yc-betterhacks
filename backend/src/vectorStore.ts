/**
 * In-memory vector store per paper. Chunks + embeddings; cosine similarity search.
 */

export interface VectorChunk {
  text: string;
  embedding: number[];
}

const paperVectors = new Map<string, VectorChunk[]>();

export function saveVectors(paperId: string, chunks: VectorChunk[]): void {
  paperVectors.set(paperId, chunks);
}

export function getVectors(paperId: string): VectorChunk[] | undefined {
  return paperVectors.get(paperId);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
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

export function search(
  paperId: string,
  queryEmbedding: number[],
  topK: number = 6
): VectorChunk[] {
  const chunks = paperVectors.get(paperId);
  if (!chunks?.length) return [];

  const withScore = chunks.map((chunk) => ({
    chunk,
    score: cosineSimilarity(chunk.embedding, queryEmbedding),
  }));
  withScore.sort((a, b) => b.score - a.score);
  return withScore.slice(0, topK).map((x) => x.chunk);
}
