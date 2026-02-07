import express, { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import { findPaperById } from '../db/queries/papers';
import { findSimilarChunks } from '../services/embeddings';

const router = express.Router();

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
const MAX_FALLBACK_CONTEXT_CHARS = 80000;
const VECTOR_TOP_K = 8;

export interface ExplainRequestBody {
  paperId: string;
  selectedText: string;
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

function buildContextFromChunks(chunks: readonly { content: string }[]): string {
  return chunks.map((c, i) => `[Section ${i + 1}]\n${c.content}`).join('\n\n');
}

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { paperId, selectedText, messages = [] }: ExplainRequestBody = req.body;

    if (!paperId || typeof selectedText !== 'string') {
      res.status(400).json({ error: 'paperId and selectedText are required' });
      return;
    }

    const paper = await findPaperById(paperId);
    if (!paper) {
      res.status(404).json({ error: 'Paper not found' });
      return;
    }

    const fullText = paper.raw_text;
    let paperContext: string;

    try {
      const relevantChunks = await findSimilarChunks(paperId, selectedText, VECTOR_TOP_K);
      if (relevantChunks.length > 0) {
        paperContext = buildContextFromChunks(relevantChunks);
      } else {
        paperContext =
          fullText.length > MAX_FALLBACK_CONTEXT_CHARS
            ? fullText.slice(0, MAX_FALLBACK_CONTEXT_CHARS) + '\n\n[... paper truncated for context ...]'
            : fullText;
      }
    } catch {
      paperContext =
        fullText.length > MAX_FALLBACK_CONTEXT_CHARS
          ? fullText.slice(0, MAX_FALLBACK_CONTEXT_CHARS) + '\n\n[... paper truncated for context ...]'
          : fullText;
    }

    const systemPrompt = `You are a helpful assistant that explains research papers. The user is reading a paper and has selected a passage. Use the relevant paper sections below only for context. Focus on explaining the selected passage clearly: definitions, intuition, and how it fits the paper. Be concise but complete. If the user asks follow-up questions, answer in the same helpful tone.

Relevant paper sections (for context only):
${paperContext}`;

    const conversationMessages: Parameters<typeof client.messages.create>[0]['messages'] =
      messages.length > 0
        ? messages.map((m) => ({ role: m.role, content: m.content }))
        : [
            {
              role: 'user' as const,
              content: `Selected passage from the paper:\n\n"${selectedText}"\n\nPlease explain this passage.`,
            },
          ];

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: systemPrompt,
      messages: conversationMessages,
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const reply = textBlock && 'text' in textBlock ? textBlock.text : '';

    res.json({ reply });
  } catch (err) {
    console.error('Explain error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to get explanation',
    });
  }
});

export const explainRouter = router;
