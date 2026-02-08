/**
 * Stub for Semantic Scholar API. Returns null so citation enrichment
 * still runs (Claude relevance) without S2 metadata. Replace with real
 * lookup when S2_API_KEY or similar is configured.
 */
export interface S2Paper {
  paperId: string;
  title: string | null;
  abstract: string | null;
  year: number | null;
  authors?: Array<{ name: string }>;
  externalIds?: { DOI?: string };
}

export async function lookupCitedPaper(_rawReference: string): Promise<S2Paper | null> {
  return null;
}
