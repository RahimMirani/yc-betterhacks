import { PoolClient } from '@neondatabase/serverless'
import { query, queryOne } from '../pool'

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

export async function insertCitations(
  paperId: string,
  citations: readonly { citationKey: string; rawReference: string | null; contextInPaper: string | null }[],
  client?: PoolClient,
): Promise<void> {
  if (citations.length === 0) return

  const values: string[] = []
  const params: unknown[] = []
  let paramIndex = 1

  for (const c of citations) {
    values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`)
    params.push(paperId, c.citationKey, c.rawReference, c.contextInPaper)
    paramIndex += 4
  }

  const sql = `INSERT INTO citations (paper_id, citation_key, raw_reference, context_in_paper)
     VALUES ${values.join(', ')}`

  if (client) {
    await client.query(sql, params)
    return
  }
  await query(sql, params)
}

export async function findCitationsByPaperId(paperId: string): Promise<readonly CitationRow[]> {
  return query<CitationRow>(
    `SELECT * FROM citations
      WHERE paper_id = $1
      ORDER BY
        CASE
          WHEN citation_key ~ '^[0-9]+$' THEN citation_key::integer
          ELSE NULL
        END,
        citation_key`,
    [paperId],
  )
}

export async function findCitation(
  paperId: string,
  citationKey: string,
): Promise<CitationRow | null> {
  return queryOne<CitationRow>(
    `SELECT * FROM citations WHERE paper_id = $1 AND citation_key = $2`,
    [paperId, citationKey],
  )
}

export async function updateCitationEnrichment(
  id: string,
  data: {
    citedTitle: string | null
    citedAbstract: string | null
    citedAuthors: readonly string[] | null
    citedYear: number | null
    citedDoi: string | null
    citedS2Id: string | null
    relevanceExplanation: string | null
    enriched: boolean
    enrichmentFailed: boolean
    failureReason: string | null
  },
): Promise<CitationRow | null> {
  return queryOne<CitationRow>(
    `UPDATE citations SET
       cited_title = $2,
       cited_abstract = $3,
       cited_authors = $4,
       cited_year = $5,
       cited_doi = $6,
       cited_s2_id = $7,
       relevance_explanation = $8,
       enriched = $9,
       enrichment_failed = $10,
       failure_reason = $11,
       enriched_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      data.citedTitle,
      data.citedAbstract,
      data.citedAuthors ? JSON.stringify(data.citedAuthors) : null,
      data.citedYear,
      data.citedDoi,
      data.citedS2Id,
      data.relevanceExplanation,
      data.enriched,
      data.enrichmentFailed,
      data.failureReason,
    ],
  )
}
