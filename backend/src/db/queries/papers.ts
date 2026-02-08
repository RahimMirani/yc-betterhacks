import { query, queryOne } from '../pool';

export interface PaperRow {
  readonly id: string;
  readonly title: string;
  readonly authors: unknown;
  readonly year: number | null;
  readonly raw_text: string;
  readonly created_at: string;
}

export async function insertPaper(params: {
  title: string;
  authors: unknown;
  year: number | null;
  rawText: string;
}): Promise<PaperRow> {
  const rows = await query<PaperRow>(
    `INSERT INTO papers (title, authors, year, raw_text)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [params.title, params.authors ? JSON.stringify(params.authors) : null, params.year, params.rawText]
  );
  if (!rows[0]) throw new Error('Insert paper failed');
  return rows[0];
}

export async function findPaperById(id: string): Promise<PaperRow | null> {
  return queryOne<PaperRow>(`SELECT * FROM papers WHERE id = $1`, [id]);
}
