export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Paper {
  readonly id: string;
  readonly title: string;
  readonly authors: readonly string[] | null;
  readonly year: number | null;
  readonly rawText: string;
  readonly createdAt: string;
}

export interface PaperSummary {
  readonly id: string;
  readonly title: string;
  readonly authors: readonly string[] | null;
  readonly year: number | null;
  readonly citationCount: number;
  readonly createdAt: string;
}

export interface Citation {
  readonly id: string;
  readonly paperId: string;
  readonly citationKey: string;
  readonly rawReference: string | null;
  readonly contextInPaper: string | null;
  readonly citedTitle: string | null;
  readonly citedAbstract: string | null;
  readonly citedAuthors: readonly string[] | null;
  readonly citedYear: number | null;
  readonly citedDoi: string | null;
  readonly citedS2Id: string | null;
  readonly relevanceExplanation: string | null;
  readonly enriched: boolean;
  readonly enrichmentFailed: boolean;
  readonly failureReason: string | null;
  readonly createdAt: string;
  readonly enrichedAt: string | null;
}

export interface CitationSummary {
  readonly id: string;
  readonly citationKey: string;
  readonly enriched: boolean;
  readonly citedTitle: string | null;
}

export interface CitationMarkerPosition {
  readonly key: string;
  readonly positions: readonly { readonly start: number; readonly end: number }[];
}

export interface ParsedCitation {
  readonly citationKey: string;
  readonly rawReference: string | null;
  readonly contextInPaper: string | null;
}

export interface ParsedPaper {
  readonly title: string;
  readonly authors: readonly string[];
  readonly year: number | null;
  readonly text: string;
  readonly citations: readonly ParsedCitation[];
}

export interface S2Paper {
  readonly paperId: string;
  readonly title: string;
  readonly abstract: string | null;
  readonly authors: readonly { readonly name: string }[];
  readonly year: number | null;
  readonly externalIds: Readonly<Record<string, string>> | null;
  readonly citationCount: number | null;
}

export interface S2SearchResponse {
  readonly total: number;
  readonly data: readonly S2Paper[];
}
