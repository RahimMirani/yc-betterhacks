import OpenAI from 'openai'
import { PoolClient } from '@neondatabase/serverless'
import { env } from '../config/env'
import { query } from '../db/pool'
import { chunkText } from '../utils/text'

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

const EMBEDDING_MODEL = 'text-embedding-3-small'
const BATCH_SIZE = 20

export async function embedAndStoreChunks(
  paperId: string,
  text: string,
  client?: PoolClient,
): Promise<number> {
  const chunks = chunkText(text)
  let stored = 0

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE)
    const embeddings = await generateEmbeddings(batch)

    const values: string[] = []
    const params: unknown[] = []
    let paramIndex = 1

    for (let j = 0; j < batch.length; j++) {
      values.push(
        `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`,
      )
      params.push(paperId, i + j, batch[j], JSON.stringify(embeddings[j]))
      paramIndex += 4
    }

    const sql = `INSERT INTO paper_chunks (paper_id, chunk_index, content, embedding)
       VALUES ${values.join(', ')}`

    if (client) {
      await client.query(sql, params)
    } else {
      await query(sql, params)
    }

    stored += batch.length
  }

  return stored
}

export async function generateEmbeddings(
  texts: readonly string[],
): Promise<readonly number[][]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts as string[],
  })

  return response.data.map((d) => d.embedding)
}

export async function findSimilarChunks(
  paperId: string,
  queryText: string,
  limit: number = 3,
): Promise<readonly { content: string; similarity: number }[]> {
  const [embedding] = await generateEmbeddings([queryText])

  const rows = await query<{ content: string; similarity: number }>(
    `SELECT content, 1 - (embedding <=> $1::vector) AS similarity
     FROM paper_chunks
     WHERE paper_id = $2
     ORDER BY embedding <=> $1::vector
     LIMIT $3`,
    [JSON.stringify(embedding), paperId, limit],
  )

  return rows
}
