/**
 * Split document text into overlapping chunks for embedding.
 * Keeps semantic boundaries where possible (paragraphs).
 */

const DEFAULT_CHUNK_SIZE = 800;
const DEFAULT_OVERLAP = 150;

export interface ChunkOptions {
  chunkSize?: number;
  overlap?: number;
}

export function chunkText(
  text: string,
  options: ChunkOptions = {}
): string[] {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const overlap = options.overlap ?? DEFAULT_OVERLAP;

  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + chunkSize, normalized.length);
    let slice = normalized.slice(start, end);

    if (end < normalized.length) {
      const lastNewline = slice.lastIndexOf('\n');
      const lastPeriod = slice.lastIndexOf('. ');
      const breakAt = Math.max(lastNewline, lastPeriod);
      if (breakAt > chunkSize / 2) {
        end = start + breakAt + 1;
        slice = normalized.slice(start, end);
      }
    }

    if (slice.trim()) chunks.push(slice.trim());
    const nextStart = end - overlap;
    if (nextStart <= start) start = end;
    else start = nextStart;
    if (start >= normalized.length) break;
  }

  return chunks;
}
