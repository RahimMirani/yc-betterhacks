import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config";
import {
  buildNotebook,
  notebookToString,
  NotebookCell,
} from "./notebookBuilder";

// ─── Claude Client ───────────────────────────────────────────────────────────

const MODEL = "claude-sonnet-4-20250514";

const client = new Anthropic({
  apiKey: config.anthropicApiKey,
});

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PaperAnalysis {
  title: string;
  authors: string;
  domain: string;
  coreProblem: string;
  coreContribution: string;
  methods: Array<{
    name: string;
    description: string;
    section: string;
  }>;
  algorithms: Array<{
    name: string;
    pseudocode: string;
    section: string;
  }>;
  equations: Array<{
    description: string;
    latex: string;
    variables: string;
    section: string;
  }>;
  architecture: string;
  hyperparameters: Array<{
    name: string;
    value: string;
    context: string;
  }>;
  datasets: Array<{
    name: string;
    description: string;
    size: string;
  }>;
  evaluationMetrics: string[];
  requiredLibraries: string[];
  paperComplexity: "low" | "medium" | "high";
}

export interface ImplementationPlan {
  summary: string;
  framework: string;
  frameworkReasoning: string;
  simplifications: string[];
  steps: Array<{
    order: number;
    title: string;
    description: string;
    components: string[];
    estimatedLines: number;
  }>;
  demoDataStrategy: string;
  totalEstimatedLines: number;
}

export async function askClaude(prompt: string): Promise<string> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  const textBlock = message.content.find((block) => block.type === "text");
  return textBlock && "text" in textBlock ? textBlock.text : "";
}

export async function askClaudeWithConversation(
  system: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });
  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock && "text" in textBlock ? textBlock.text : "";
}

export async function askClaude(prompt: string): Promise<string> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });
  const textBlock = message.content.find((block) => block.type === 'text');
  return textBlock && 'text' in textBlock ? textBlock.text : '';
}

export async function askClaudeWithConversation(
  system: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });
  const textBlock = response.content.find((block) => block.type === 'text');
  return textBlock && 'text' in textBlock ? textBlock.text : '';
}

export async function explainCitationRelevance(params: {
  contextInPaper: string;
  citedTitle: string | null;
  citedAbstract: string | null;
  rawReference: string | null;
}): Promise<string> {
  const citedInfo = params.citedTitle
    ? `Cited paper title: "${params.citedTitle}"\nCited paper abstract: "${params.citedAbstract ?? "Not available"}"`
    : `Raw reference: "${params.rawReference ?? "Not available"}"`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `You are an academic paper reading assistant. Given the following context from a research paper where a citation appears, and information about the cited paper, explain in 2-3 sentences why this citation is relevant and what the reader should know about the cited work in this context.

Source paper context: "${params.contextInPaper}"

${citedInfo}

Explain the relevance concisely. Do not use phrases like "This citation" or "The cited paper" — refer to the work by its subject matter directly.`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock && "text" in textBlock
    ? textBlock.text
    : "Unable to generate explanation.";
}

export interface GeneratedNotebook {
  notebookJson: string;
  cells: NotebookCell[];
  colabTitle: string;
}

// Rate limiting configuration
const RATE_LIMIT_DELAY = 6000; // 6 seconds between requests
const MAX_RETRIES = 3;
const RETRY_DELAY = 10000; // 10 seconds initial retry delay

/**
 * Sleep utility for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper: sends a prompt to Claude and returns the text response.
 * Includes rate limiting and retry logic.
 */

async function callClaude(systemPrompt: string, userPrompt: string, maxTokens: number = 4096): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Add delay between requests to respect rate limits
      if (attempt > 0) {
        const backoffDelay = RETRY_DELAY * Math.pow(2, attempt - 1);
        console.log(`[Rate Limit] Retry attempt ${attempt + 1}/${MAX_RETRIES}. Waiting ${backoffDelay}ms...`);
        await sleep(backoffDelay);
      }

      const message = await client.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt },
        ],
      });

      const textBlock = message.content.find((block) => block.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('Claude returned no text response');
      }

      // Add delay after successful request to prevent hitting rate limits on next call
      await sleep(RATE_LIMIT_DELAY);

      return textBlock.text;
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a rate limit error
      if (error?.status === 429 || error?.error?.type === 'rate_limit_error') {
        console.log(`[Rate Limit] Hit rate limit on attempt ${attempt + 1}/${MAX_RETRIES}`);
        
        // If this is not the last attempt, continue to retry
        if (attempt < MAX_RETRIES - 1) {
          continue;
        }
      } else {
        // For non-rate-limit errors, throw immediately
        throw error;
      }
    }
  }

  // If we exhausted all retries, throw the last error
  throw new Error(`Failed after ${MAX_RETRIES} attempts. Last error: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Attempts to extract and parse JSON from Claude's response.
 * Handles: complete code blocks, truncated code blocks, and raw JSON.
 * For truncated JSON arrays (common with large notebooks), attempts to
 * recover by closing the array at the last complete object.
 */
function extractJson<T>(text: string): T {
  let jsonString = text;

  // 1. Try to extract from complete ```json ... ``` code block
  const completeMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (completeMatch) {
    jsonString = completeMatch[1];
  } else {
    // 2. Handle truncated code block (starts with ```json but no closing ```)
    const truncatedMatch = text.match(/```(?:json)?\s*\n?([\s\S]*)/);
    if (truncatedMatch) {
      jsonString = truncatedMatch[1];
    }
  }

  jsonString = jsonString.trim();

  // First attempt: parse as-is
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    // JSON is likely truncated — try to recover
  }

  // Recovery: if it's a truncated JSON array, find the last complete object
  if (jsonString.startsWith("[")) {
    // Find the last occurrence of }\n  , or },\n which indicates end of a complete object in the array
    const lastCompleteObj = jsonString.lastIndexOf("}\n");
    const lastCompleteObj2 = jsonString.lastIndexOf("},");

    const cutPoint = Math.max(lastCompleteObj, lastCompleteObj2);

    if (cutPoint > 0) {
      // Cut at the end of the last complete object and close the array
      let recovered = jsonString.substring(0, cutPoint + 1); // include the }
      // Remove trailing comma if present
      recovered = recovered.replace(/,\s*$/, "");
      recovered += "]";

      try {
        console.log(
          `[JSON Recovery] Truncated response recovered. Cut at position ${cutPoint}/${jsonString.length}`,
        );
        return JSON.parse(recovered) as T;
      } catch {
        // Recovery failed too
      }
    }
  }

  console.error(
    "Failed to parse Claude JSON response. Raw text:",
    text.substring(0, 500),
  );
  throw new Error("Claude returned invalid JSON. Please try again.");
}

/**
 * Helper: sends a prompt to Claude and parses the JSON response.
 */
async function callClaudeJson<T>(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 4096,
): Promise<T> {
  const text = await callClaude(systemPrompt, userPrompt, maxTokens);
  return extractJson<T>(text);
}

// ─── Pipeline Step 1: Analyze Paper ──────────────────────────────────────────

const ANALYSIS_SYSTEM_PROMPT = `You are an expert research paper analyst. Your job is to deeply analyze a research paper and extract all information needed to implement it as working code.

You must return your analysis as a single JSON object with EXACTLY this structure:
{
  "title": "paper title",
  "authors": "author names",
  "domain": "e.g. Computer Vision, NLP, Reinforcement Learning, etc.",
  "coreProblem": "what problem does this paper solve?",
  "coreContribution": "what is novel about their approach?",
  "methods": [
    { "name": "method name", "description": "what it does and how", "section": "which section describes it" }
  ],
  "algorithms": [
    { "name": "algorithm name", "pseudocode": "simplified pseudocode", "section": "section reference" }
  ],
  "equations": [
    { "description": "what this equation computes", "latex": "the equation", "variables": "what each variable means", "section": "section reference" }
  ],
  "architecture": "overall model/system architecture description",
  "hyperparameters": [
    { "name": "param name", "value": "value used", "context": "where/how it's used" }
  ],
  "datasets": [
    { "name": "dataset name", "description": "what it contains", "size": "approximate size" }
  ],
  "evaluationMetrics": ["metric1", "metric2"],
  "requiredLibraries": ["pytorch", "numpy", "etc"],
  "paperComplexity": "low" | "medium" | "high"
}

Be thorough. Extract EVERY algorithm, equation, and hyperparameter mentioned. This analysis will be used to generate a complete code implementation, so missing details means missing code.

Return ONLY the JSON object, no other text.`;

export async function analyzePaper(paperText: string): Promise<PaperAnalysis> {
  const userPrompt = `Analyze the following research paper thoroughly. Extract all implementable details.\n\n--- PAPER TEXT ---\n${paperText}\n--- END PAPER TEXT ---`;

  return callClaudeJson<PaperAnalysis>(
    ANALYSIS_SYSTEM_PROMPT,
    userPrompt,
    4096,
  );
}

// ─── Pipeline Step 2: Create Implementation Plan ─────────────────────────────

const PLAN_SYSTEM_PROMPT = `You are an expert ML/research engineer who creates implementation plans for research papers. Given a paper's text and a structured analysis, create a practical, step-by-step implementation plan.

Your plan should be realistic and optimized for a Google Colab notebook:
- Choose the right framework (PyTorch, TensorFlow, JAX) based on what fits the paper best
- Plan for a RUNNABLE demo — if the original dataset is too large, plan for synthetic/sample data
- Break the implementation into logical ordered steps
- Consider what can be simplified without losing the core contribution

Return your plan as a single JSON object with EXACTLY this structure:
{
  "summary": "one paragraph summary of what will be implemented",
  "framework": "pytorch | tensorflow | jax | numpy",
  "frameworkReasoning": "why this framework fits best",
  "simplifications": [
    "description of each simplification and why it's acceptable"
  ],
  "steps": [
    {
      "order": 1,
      "title": "step title",
      "description": "what this step implements and why",
      "components": ["function or class names to implement"],
      "estimatedLines": 30
    }
  ],
  "demoDataStrategy": "how to handle data for a runnable demo",
  "totalEstimatedLines": 300
}

Return ONLY the JSON object, no other text.`;

export async function createImplementationPlan(
  paperText: string,
  analysis: PaperAnalysis,
): Promise<ImplementationPlan> {
  const userPrompt = `Create a practical implementation plan for this paper.

--- PAPER ANALYSIS ---
${JSON.stringify(analysis, null, 2)}

--- PAPER TEXT ---
${paperText}
--- END PAPER TEXT ---`;

  return callClaudeJson<ImplementationPlan>(
    PLAN_SYSTEM_PROMPT,
    userPrompt,
    4096,
  );
}

// ─── Pipeline Step 3: Generate Notebook ──────────────────────────────────────

const NOTEBOOK_SYSTEM_PROMPT = `You are an expert ML engineer who creates high-quality Google Colab notebooks that implement research papers. You write clean, well-documented, RUNNABLE code.

Given a paper's text, analysis, and implementation plan, generate a complete Colab notebook as a JSON array of cells.

Each cell is an object with:
- "cell_type": either "markdown" or "code"
- "source": the cell content as a string

NOTEBOOK STRUCTURE RULES:
1. Start with a title markdown cell: "# Implementation: [Paper Title]"
2. Add a markdown cell summarizing the paper and what will be implemented
3. Add an implementation plan overview markdown cell
4. First code cell: all pip installs (use !pip install -q ...)
5. Second code cell: all imports
6. Then alternate between markdown explanations and code cells:
   - Markdown cell: explain what section of the paper is being implemented, reference specific sections/equations
   - Code cell: the actual implementation with inline comments
7. End with evaluation/visualization code
8. Final markdown cell: summary and next steps

CODE QUALITY RULES:
- Every code cell must be syntactically valid Python
- Include inline comments that map code to paper sections: # Section 3.2: Scaled dot-product attention
- Include inline comments mapping to equations: # Eq. (4): attention(Q,K,V) = softmax(QK^T/sqrt(d_k))V
- Use type hints where appropriate
- Include docstrings for classes and key functions
- Make the code ACTUALLY RUNNABLE — use sample/synthetic data if needed
- Set random seeds for reproducibility
- Print intermediate outputs so the user can see progress
- Include basic visualization (matplotlib plots) for results

MARKDOWN CELL RULES:
- Reference specific paper sections: "As described in Section 3.2..."
- Explain equations before the code that implements them
- Explain design decisions and simplifications
- Keep explanations concise but informative
- Use LaTeX for equations in markdown: $equation$

Return a JSON array of cell objects. Example:
[
  { "cell_type": "markdown", "source": "# Implementation: Paper Title\\n\\nThis notebook implements..." },
  { "cell_type": "code", "source": "!pip install -q torch torchvision" },
  { "cell_type": "markdown", "source": "## 1. Setup and Imports" },
  { "cell_type": "code", "source": "import torch\\nimport torch.nn as nn" }
]

CRITICAL OUTPUT RULES:
- Keep the TOTAL response under 14000 tokens. Be concise.
- Combine related code into fewer, larger code cells rather than many tiny cells.
- Keep markdown explanations to 2-4 sentences per cell — be precise, not verbose.
- Aim for 15-25 total cells.
- Return ONLY the JSON array, no other text. Make sure the JSON is valid.
- Do NOT wrap the JSON in markdown code fences.`;

export async function generateNotebook(
  paperText: string,
  analysis: PaperAnalysis,
  plan: ImplementationPlan,
): Promise<GeneratedNotebook> {
  const userPrompt = `Generate a complete, runnable Google Colab notebook implementing this paper. Keep it concise but complete — aim for 15-25 cells total.

--- PAPER ANALYSIS ---
${JSON.stringify(analysis, null, 2)}

--- IMPLEMENTATION PLAN ---
${JSON.stringify(plan, null, 2)}

--- PAPER TEXT ---
${paperText}
--- END PAPER TEXT ---

Generate the notebook as a JSON array of cells. Return ONLY the raw JSON array — no markdown code fences. Be concise but complete.`;

  const cells = await callClaudeJson<NotebookCell[]>(
    NOTEBOOK_SYSTEM_PROMPT,
    userPrompt,
    16384,
  );

  // Validate cells
  if (!Array.isArray(cells) || cells.length === 0) {
    throw new Error("Claude returned invalid notebook cells");
  }

  for (const cell of cells) {
    if (!cell.cell_type || !cell.source) {
      throw new Error(
        "Invalid cell structure: each cell must have cell_type and source",
      );
    }
    if (cell.cell_type !== "markdown" && cell.cell_type !== "code") {
      throw new Error(
        `Invalid cell_type: ${cell.cell_type}. Must be "markdown" or "code".`,
      );
    }
  }

  // Build the .ipynb JSON
  const title = `Implementation_${analysis.title
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 60)}`;
  const notebook = buildNotebook(cells, title);

  return {
    notebookJson: notebookToString(notebook),
    cells,
    colabTitle: title,
  };
}

// ─── Full Pipeline ───────────────────────────────────────────────────────────

export interface PipelineResult {
  analysis: PaperAnalysis;
  plan: ImplementationPlan;
  notebook: GeneratedNotebook;
}

/**
 * Runs the full 3-step pipeline:
 * 1. Analyze the paper
 * 2. Create an implementation plan
 * 3. Generate the Colab notebook
 *
 * Each step feeds its output to the next for richer context.
 */
export async function runFullPipeline(
  paperText: string,
): Promise<PipelineResult> {
  console.log("[Pipeline] Step 1/3: Analyzing paper...");
  const analysis = await analyzePaper(paperText);
  console.log(
    `[Pipeline] Analysis complete. Domain: ${analysis.domain}, Complexity: ${analysis.paperComplexity}`,
  );

  console.log("[Pipeline] Step 2/3: Creating implementation plan...");
  const plan = await createImplementationPlan(paperText, analysis);
  console.log(
    `[Pipeline] Plan complete. ${plan.steps.length} steps, ~${plan.totalEstimatedLines} lines of code`,
  );

  console.log("[Pipeline] Step 3/3: Generating notebook...");
  const notebook = await generateNotebook(paperText, analysis, plan);
  console.log(
    `[Pipeline] Notebook complete. ${notebook.cells.length} cells generated`,
  );

  return { analysis, plan, notebook };
}
