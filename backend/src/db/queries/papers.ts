import { PoolClient } from '@neondatabase/serverless'
import { query, queryOne } from '../pool'

interface PaperRow {
  readonly id: string
  readonly title: string
  readonly authors: readonly string[] | null
  readonly year: number | null
  readonly raw_text: string
  readonly created_at: string
}

export async function insertPaper(
  params: {
    title: string
    authors: readonly string[] | null
    year: number | null
    rawText: string
  },
  client?: PoolClient,
): Promise<PaperRow> {
  const sql = `INSERT INTO papers (title, authors, year, raw_text)
     VALUES ($1, $2, $3, $4)
     RETURNING *`

  const values = [
    params.title,
    params.authors === null ? null : JSON.stringify(params.authors),
    params.year,
    params.rawText,
  ]

  if (client) {
    const result = await client.query(sql, values)
    return result.rows[0] as PaperRow
  }
  const rows = await query<PaperRow>(sql, values)
  return rows[0]
}

export async function findPaperById(id: string): Promise<PaperRow | null> {
  return queryOne<PaperRow>(
    `SELECT * FROM papers WHERE id = $1`,
    [id],
  )
}
