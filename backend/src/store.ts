/**
 * In-memory store for uploaded papers (extracted text).
 * Keyed by paperId. For production, replace with DB + optional vector store.
 */

export interface PaperRecord {
  paperId: string;
  filename: string;
  fullText: string;
  createdAt: Date;
}

const papers = new Map<string, PaperRecord>();

export function savePaper(paperId: string, filename: string, fullText: string): void {
  papers.set(paperId, {
    paperId,
    filename,
    fullText,
    createdAt: new Date(),
  });
}

export function getPaper(paperId: string): PaperRecord | undefined {
  return papers.get(paperId);
}

export function getPaperText(paperId: string): string | null {
  return papers.get(paperId)?.fullText ?? null;
}
