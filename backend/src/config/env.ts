import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3001').transform(Number),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
