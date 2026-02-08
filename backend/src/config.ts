import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend root (works in dev and from dist/)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const port = process.env.PORT;
export const config = {
  /** Port for the server. Railway sets PORT; default 3001 for local dev. */
  port: port ? Number(port) : 3001,

  // Anthropic (Claude API)
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',

  // OpenAI (embeddings)
  openaiApiKey: process.env.OPENAI_API_KEY || '',

  // Database (Neon Postgres with pgvector)
  databaseUrl: process.env.DATABASE_URL || '',

  // GitHub (for Gist uploads)
  githubToken: process.env.GITHUB_TOKEN || '',
  githubUsername: process.env.GITHUB_USERNAME || '',

  // PDF upload limits
  maxPdfSizeMB: 50,

  /** Directory for uploaded PDFs. Use env in production (e.g. /tmp/uploads on Railway). */
  uploadDir: process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'),

  /** CORS: comma-separated origins or '*' to allow all. Set FRONTEND_URL or ALLOWED_ORIGINS in production. */
  allowedOrigins: process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || '*',
};
