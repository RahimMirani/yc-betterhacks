import { query, queryOne } from '../pool'

interface PaperRow {
  readonly id: string
  readonly title: string
  readonly authors: readonly string[] | null
  readonly year: number | null
  readonly raw_text: string
  readonly created_at: string
}

export async function insertPaper(params: {
  title: string
  authors: readonly string[] | null
  year: number | null
  rawText: string
}): Promise<PaperRow> {
  const rows = await query<PaperRow>(
    `INSERT INTO papers (title, authors, year, raw_text)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [params.title, JSON.stringify(params.authors), params.year, params.rawText],
  )
  return rows[0]
}

export async function findPaperById(id: string): Promise<PaperRow | null> {
  return queryOne<PaperRow>(
    `SELECT * FROM papers WHERE id = $1`,
    [id],
  )
}
