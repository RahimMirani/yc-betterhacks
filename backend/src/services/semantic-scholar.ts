import { S2Paper, S2SearchResponse } from '../types';
import { DOI_REGEX } from '../utils/citation-patterns';
import { extractTitleFromReference } from '../utils/text';

const S2_BASE_URL = 'https://api.semanticscholar.org/graph/v1';
const S2_FIELDS = 'title,abstract,authors,year,externalIds,citationCount';
const ARXIV_ID_REGEX = /(?:arXiv:?\s*)?(\d{4}\.\d{4,5}(?:v\d+)?)/i;

const RATE_LIMIT_DELAY_MS = 1000;
let lastRequestTime = 0;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_DELAY_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, RATE_LIMIT_DELAY_MS - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();
  return fetch(url);
}

async function fetchPaperByArxivId(arxivId: string): Promise<S2Paper | null> {
  try {
    const response = await rateLimitedFetch(
      `${S2_BASE_URL}/paper/ARXIV:${encodeURIComponent(arxivId)}?fields=${S2_FIELDS}`
    );

    if (!response.ok) return null;
    return (await response.json()) as S2Paper;
  } catch {
    return null;
  }
}

async function fetchPaperByDoi(doi: string): Promise<S2Paper | null> {
  try {
    const response = await rateLimitedFetch(
      `${S2_BASE_URL}/paper/DOI:${encodeURIComponent(doi)}?fields=${S2_FIELDS}`
    );

    if (!response.ok) return null;
    return (await response.json()) as S2Paper;
  } catch {
    return null;
  }
}

async function searchPaperByTitle(title: string): Promise<S2Paper | null> {
  try {
    const response = await rateLimitedFetch(
      `${S2_BASE_URL}/paper/search?query=${encodeURIComponent(title)}&limit=3&fields=${S2_FIELDS}`
    );

    if (!response.ok) return null;

    const result = (await response.json()) as S2SearchResponse;
    if (!result.data || result.data.length === 0) return null;

    const normalizedQuery = title.toLowerCase().trim();
    const bestMatch = result.data.reduce((best, current) => {
      const currentSimilarity = titleSimilarity(current.title, normalizedQuery);
      const bestSimilarity = titleSimilarity(best.title, normalizedQuery);
      return currentSimilarity > bestSimilarity ? current : best;
    });

    return bestMatch;
  } catch {
    return null;
  }
}

function titleSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = [...wordsA].filter((w) => wordsB.has(w));
  return intersection.length / Math.max(wordsA.size, wordsB.size);
}

export async function lookupCitedPaper(rawReference: string): Promise<S2Paper | null> {
  const doiMatch = rawReference.match(DOI_REGEX);
  if (doiMatch) {
    const paper = await fetchPaperByDoi(doiMatch[0]);
    if (paper) return paper;
  }

  const arxivMatch = rawReference.match(ARXIV_ID_REGEX);
  if (arxivMatch) {
    const paper = await fetchPaperByArxivId(arxivMatch[1]);
    if (paper) return paper;
  }

  const extractedTitle = extractTitleFromReference(rawReference);
  if (extractedTitle) {
    const paper = await searchPaperByTitle(extractedTitle);
    if (paper) return paper;
  }

  const paper = await searchPaperByTitle(rawReference.slice(0, 200));
  return paper;
}
