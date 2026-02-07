/**
 * Ingest PDF text: chunk, embed, and store in vector store.
 * No-op if no embedding provider (VOYAGE_API_KEY or OPENAI_API_KEY) is set.
 */

import { chunkText } from './chunking';
import { hasEmbeddingProvider, embedMany } from './embeddings';
import { saveVectors } from './vectorStore';
import type { VectorChunk } from './vectorStore';

export async function ingestPaperText(paperId: string, fullText: string): Promise<void> {
  if (!hasEmbeddingProvider()) return;

  const chunks = chunkText(fullText);
  if (chunks.length === 0) return;

  const embeddings = await embedMany(chunks);
  const vectorChunks: VectorChunk[] = chunks
    .map((text, i) => ({ text, embedding: embeddings[i] ?? [] }))
    .filter((c) => c.embedding.length > 0);

  if (vectorChunks.length > 0) saveVectors(paperId, vectorChunks);
}
