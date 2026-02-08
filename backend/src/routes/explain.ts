import express, { Request, Response } from 'express';
import { findPaperById } from '../db/queries/papers';
import { findCitationsByPaperId } from '../db/queries/citations';
import { findSimilarChunks } from '../services/embeddings';
import { explainPrompt } from '../services/prompts';
import { askClaude, askClaudeWithConversation } from '../services/claude';
import { enrichCitation } from '../services/citation-enrichment';

const router = express.Router();

const MAX_FALLBACK_CONTEXT_CHARS = 80000;
const VECTOR_TOP_K = 8;
const SELECTION_CITATION_WINDOW = 600;

export interface ExplainRequestBody {
  paperId: string;
  selectedText: string;
  level?: string;
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

function buildContextFromChunks(chunks: readonly { content: string }[]): string {
  return chunks.map((c, i) => `[Section ${i + 1}]\n${c.content}`).join('\n\n');
}

function getCitationPositions(
  text: string,
  citations: readonly { citation_key: string }[]
): { key: string; positions: { start: number; end: number }[] }[] {
  const uniqueKeys = [...new Set(citations.map((c) => c.citation_key))];
  return uniqueKeys.map((key) => {
    const escapedKey = key.replace(/[[\]().,]/g, '\\$&');
    const regex = new RegExp(escapedKey, 'g');
    const positions: { start: number; end: number }[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      positions.push({ start: match.index, end: match.index + match[0].length });
    }
    return { key, positions };
  });
}

function findCitationsNearSelection(
  fullText: string,
  selectedText: string,
  citations: readonly { citation_key: string }[],
  window: number
): string[] {
  const firstIndex = fullText.indexOf(selectedText.trim());
  if (firstIndex === -1) return [];
  const rangeStart = Math.max(0, firstIndex - window);
  const rangeEnd = Math.min(fullText.length, firstIndex + selectedText.length + window);
  const markers = getCitationPositions(fullText, citations);
  const keysNear: string[] = [];
  for (const { key, positions } of markers) {
    const inRange = positions.some(
      (p) => (p.start >= rangeStart && p.start <= rangeEnd) || (p.end >= rangeStart && p.end <= rangeEnd)
    );
    if (inRange) keysNear.push(key);
  }
  return keysNear;
}

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      paperId,
      selectedText,
      level = 'intermediate',
      messages = [],
    }: ExplainRequestBody = req.body;

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

    // 1) Embeddings: relevant chunks from DB
    let paperContext: string;
    try {
      const relevantChunks = await findSimilarChunks(paperId, selectedText, VECTOR_TOP_K);
      if (relevantChunks.length > 0) {
        paperContext = buildContextFromChunks(relevantChunks);
      } else {
        paperContext =
          fullText.length > MAX_FALLBACK_CONTEXT_CHARS
            ? fullText.slice(0, MAX_FALLBACK_CONTEXT_CHARS) + '\n\n[... paper truncated ...]'
            : fullText;
      }
    } catch {
      paperContext =
        fullText.length > MAX_FALLBACK_CONTEXT_CHARS
          ? fullText.slice(0, MAX_FALLBACK_CONTEXT_CHARS) + '\n\n[... paper truncated ...]'
          : fullText;
    }

    // 2) Citations: in or near selected passage, enriched
    const allCitations = await findCitationsByPaperId(paperId);
    const keysNear = findCitationsNearSelection(
      fullText,
      selectedText,
      allCitations,
      SELECTION_CITATION_WINDOW
    );
    const citationsForContext = allCitations.filter((c) => keysNear.includes(c.citation_key));
    const enrichedCitations: Array<(typeof allCitations)[number]> = [];
    for (const c of citationsForContext) {
      let row = c;
      if (!row.enriched && !row.enrichment_failed) {
        try {
          row = await enrichCitation(paperId, row);
        } catch {
          // keep original
        }
      }
      enrichedCitations.push(row);
    }

    const citationsBlock =
      enrichedCitations.length === 0
        ? 'None identified in or near this passage.'
        : enrichedCitations
            .map(
              (c) =>
                `[${c.citation_key}] ${c.cited_title ?? c.raw_reference ?? 'Unknown'}. ${c.relevance_explanation ?? ''}`
            )
            .join('\n');

    const combinedContent = `Selected passage from the paper:\n\n"${selectedText}"\n\n---\nRelevant paper sections (for context):\n${paperContext}\n\n---\nCitations in or near this passage:\n${citationsBlock}`;

    if (messages.length === 0) {
      const prompt = explainPrompt(combinedContent, level);
      const reply = await askClaude(prompt);
      res.json({ reply });
      return;
    }

    const systemPrompt = `You explain research papers in short, crisp answers. The user has selected a passage and may ask follow-ups. Use only the context below. Keep each reply to 2–5 sentences; no long paragraphs or lists unless the question explicitly asks for detail.

Relevant paper sections:
${paperContext}

Citations in or near the passage:
${citationsBlock}`;

    const reply = await askClaudeWithConversation(systemPrompt, messages);
    res.json({ reply });
  } catch (err) {
    console.error('Explain error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to get explanation',
    });
  }
});

export const explainRouter = router;