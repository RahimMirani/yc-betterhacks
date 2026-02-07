import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const MODEL = 'claude-sonnet-4-5-20250929';

export async function explainCitationRelevance(params: {
  contextInPaper: string;
  citedTitle: string | null;
  citedAbstract: string | null;
  rawReference: string | null;
}): Promise<string> {
  const citedInfo = params.citedTitle
    ? `Cited paper title: "${params.citedTitle}"\nCited paper abstract: "${params.citedAbstract ?? 'Not available'}"`
    : `Raw reference: "${params.rawReference ?? 'Not available'}"`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `You are an academic paper reading assistant. Given the following context from a research paper where a citation appears, and information about the cited paper, explain in 2-3 sentences why this citation is relevant and what the reader should know about the cited work in this context.

Source paper context: "${params.contextInPaper}"

${citedInfo}

Explain the relevance concisely. Do not use phrases like "This citation" or "The cited paper" — refer to the work by its subject matter directly.`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  return textBlock && 'text' in textBlock ? textBlock.text : 'Unable to generate explanation.';
}
