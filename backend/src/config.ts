import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const config = {
  port: Number(process.env.PORT) || 3001,

  // Anthropic (Claude API)
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",

  // OpenAI (embeddings)
  openaiApiKey: process.env.OPENAI_API_KEY || "",

  // Database (Neon Postgres with pgvector)
  databaseUrl: process.env.DATABASE_URL || "",

  // GitHub (for Gist uploads)
  githubToken: process.env.GITHUB_TOKEN || "",
  githubUsername: process.env.GITHUB_USERNAME || "",

  // PDF upload limits
  maxPdfSizeMB: 50,
};
