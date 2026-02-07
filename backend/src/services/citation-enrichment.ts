import { lookupCitedPaper } from './semantic-scholar'
import { explainCitationRelevance } from './claude'
import { findSimilarChunks } from './embeddings'
import { updateCitationEnrichment } from '../db/queries/citations'

interface CitationRow {
  readonly id: string
  readonly paper_id: string
  readonly citation_key: string
  readonly raw_reference: string | null
  readonly context_in_paper: string | null
  readonly cited_title: string | null
  readonly cited_abstract: string | null
  readonly cited_authors: readonly string[] | null
  readonly cited_year: number | null
  readonly cited_doi: string | null
  readonly cited_s2_id: string | null
  readonly relevance_explanation: string | null
  readonly enriched: boolean
  readonly enrichment_failed: boolean
  readonly failure_reason: string | null
  readonly created_at: string
  readonly enriched_at: string | null
}

export async function enrichCitation(
  paperId: string,
  citation: CitationRow,
): Promise<CitationRow> {
  // Step 1: Look up on Semantic Scholar
  const s2Paper = citation.raw_reference
    ? await lookupCitedPaper(citation.raw_reference)
    : null

  // Step 2: Build context for Claude explanation
  let context = citation.context_in_paper ?? ''

  // Use pgvector to find additional relevant context if available
  if (context && context.length > 0) {
    try {
      const similarChunks = await findSimilarChunks(paperId, context, 2)
      const additionalContext = similarChunks
        .map((chunk) => chunk.content)
        .join(' ')

      if (additionalContext.length > 0) {
        context = `${context}\n\nAdditional context from the paper: ${additionalContext}`
      }
    } catch {
      // pgvector lookup failure is non-critical, continue with original context
    }
  }

  // Step 3: Generate relevance explanation via Claude
  let relevanceExplanation: string | null = null
  try {
    relevanceExplanation = await explainCitationRelevance({
      contextInPaper: context,
      citedTitle: s2Paper?.title ?? null,
      citedAbstract: s2Paper?.abstract ?? null,
      rawReference: citation.raw_reference,
    })
  } catch {
    // Claude failure is non-critical — we still have S2 data
  }

  // Step 4: Persist enrichment results
  const enrichmentFailed = !s2Paper
  const authors = s2Paper?.authors?.map((a) => a.name) ?? null
  const doi = s2Paper?.externalIds?.DOI ?? null

  const updated = await updateCitationEnrichment(citation.id, {
    citedTitle: s2Paper?.title ?? null,
    citedAbstract: s2Paper?.abstract ?? null,
    citedAuthors: authors,
    citedYear: s2Paper?.year ?? null,
    citedDoi: doi,
    citedS2Id: s2Paper?.paperId ?? null,
    relevanceExplanation,
    enriched: !enrichmentFailed,
    enrichmentFailed,
    failureReason: enrichmentFailed ? 'Paper not found on Semantic Scholar' : null,
  })

  return updated ?? citation
}
