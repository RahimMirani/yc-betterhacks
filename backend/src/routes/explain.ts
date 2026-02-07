import express, { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { getPaperText } from '../store';
import { search as vectorSearch } from '../vectorStore';
import { embedText } from '../embeddings';

const router = express.Router();

const MAX_FALLBACK_CONTEXT_CHARS = 80000;
const VECTOR_TOP_K = 8;

export interface ExplainRequestBody {
  paperId: string;
  selectedText: string;
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

function buildContextFromChunks(chunks: { text: string }[]): string {
  return chunks.map((c, i) => `[Section ${i + 1}]\n${c.text}`).join('\n\n');
}

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { paperId, selectedText, messages = [] }: ExplainRequestBody = req.body;

    if (!paperId || typeof selectedText !== 'string') {
      res.status(400).json({ error: 'paperId and selectedText are required' });
      return;
    }

    const fullText = getPaperText(paperId);
    if (!fullText) {
      res.status(404).json({ error: 'Paper not found' });
      return;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured' });
      return;
    }

    let paperContext: string;
    try {
      const queryEmbedding = await embedText(selectedText);
      const relevantChunks = vectorSearch(paperId, queryEmbedding, VECTOR_TOP_K);
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

    const client = new Anthropic({ apiKey });
    const systemPrompt = `You are a helpful assistant that explains research papers. The user is reading a paper and has selected a passage. Use the relevant paper sections below only for context. Focus on explaining the selected passage clearly: definitions, intuition, and how it fits the paper. Be concise but complete. If the user asks follow-up questions, answer in the same helpful tone.

Relevant paper sections (for context only):
${paperContext}`;

    const conversationMessages: Anthropic.MessageParam[] =
      messages.length > 0
        ? messages.map((m) => ({ role: m.role, content: m.content }))
        : [
            {
              role: 'user' as const,
              content: `Selected passage from the paper:\n\n"${selectedText}"\n\nPlease explain this passage.`,
            },
          ];

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
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
