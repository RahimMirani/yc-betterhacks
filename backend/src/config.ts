import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  port: process.env.PORT || 3001,

  // Anthropic (Claude API)
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',

  // GitHub (for Gist uploads)
  githubToken: process.env.GITHUB_TOKEN || '',
  githubUsername: process.env.GITHUB_USERNAME || '',

  // PDF upload limits
  maxPdfSizeMB: 50,
};
