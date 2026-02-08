import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config()

const envSchema = z.object({
  PORT: z.string().default('3001').transform(Number),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  BETTER_AUTH_SECRET: z.string().min(1, 'BETTER_AUTH_SECRET is required'),
  BETTER_AUTH_URL: z.string().default('http://localhost:3001'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

export const env = envSchema.parse(process.env)
