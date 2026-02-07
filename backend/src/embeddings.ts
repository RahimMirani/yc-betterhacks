/**
 * Generate embeddings. Supports Voyage AI (Anthropic's recommended partner) and OpenAI.
 * Prefer VOYAGE_API_KEY if set; otherwise use OPENAI_API_KEY.
 * Anthropic does not offer its own embedding model.
 */

import { VoyageAIClient } from 'voyageai';
import OpenAI from 'openai';

const VOYAGE_MODEL = 'voyage-3.5';
const OPENAI_MODEL = 'text-embedding-3-small';
const MAX_TEXT_LEN = 8000;
const VOYAGE_BATCH_SIZE = 128;

function getProvider(): 'voyage' | 'openai' | null {
  if (process.env.VOYAGE_API_KEY) return 'voyage';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return null;
}

export function hasEmbeddingProvider(): boolean {
  return getProvider() !== null;
}

export async function embedText(text: string): Promise<number[]> {
  const provider = getProvider();
  if (!provider) throw new Error('No embedding provider: set VOYAGE_API_KEY or OPENAI_API_KEY');

  const input = text.slice(0, MAX_TEXT_LEN);

  if (provider === 'voyage') {
    const client = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY! });
    const res = await client.embed({
      input,
      model: VOYAGE_MODEL,
      inputType: 'query',
    });
    const embedding = res.data?.[0]?.embedding;
    if (!embedding?.length) throw new Error('No embedding from Voyage');
    return embedding;
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const response = await client.embeddings.create({
    model: OPENAI_MODEL,
    input,
  });
  const embedding = response.data[0]?.embedding;
  if (!embedding) throw new Error('No embedding from OpenAI');
  return embedding;
}

export async function embedMany(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const provider = getProvider();
  if (!provider) throw new Error('No embedding provider: set VOYAGE_API_KEY or OPENAI_API_KEY');

  const trimmed = texts.map((t) => t.slice(0, MAX_TEXT_LEN));

  if (provider === 'voyage') {
    const client = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY! });
    const results: number[][] = [];
    for (let i = 0; i < trimmed.length; i += VOYAGE_BATCH_SIZE) {
      const batch = trimmed.slice(i, i + VOYAGE_BATCH_SIZE);
      const res = await client.embed({
        input: batch,
        model: VOYAGE_MODEL,
        inputType: 'document',
      });
      const sorted = (res.data ?? []).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
      for (const item of sorted) {
        if (item.embedding?.length) results.push(item.embedding);
      }
    }
    return results;
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const batchSize = 100;
  const results: number[][] = [];
  for (let i = 0; i < trimmed.length; i += batchSize) {
    const batch = trimmed.slice(i, i + batchSize);
    const response = await client.embeddings.create({
      model: OPENAI_MODEL,
      input: batch,
    });
    const sorted = response.data.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    for (const item of sorted) {
      if (item.embedding) results.push(item.embedding);
    }
  }
  return results;
}
