import { Router, Request, Response } from 'express';
import { analyzePaper, createImplementationPlan, generateNotebook } from '../services/claude';
import { uploadNotebookToGist } from '../services/gist';
import { getCache, setCache } from '../services/cache';

const router = Router();

// Type for the cached response data
interface ImplementResult {
  colabUrl: string;
  gistUrl: string;
  downloadUrl: string;
  analysis: Record<string, unknown>;
  plan: Record<string, unknown>;
  notebookCells: Array<{ cell_type: string; source: string }>;
  meta: Record<string, unknown>;
}

/**
 * Sends an SSE event to the client.
 */
function sendEvent(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/**
 * POST /api/implement-paper
 *
 * Uses Server-Sent Events to stream progress updates to the frontend.
 * Steps: check cache → analyze → plan → generate notebook → upload gist
 */
router.post('/implement-paper', async (req: Request, res: Response) => {
  const { paperText } = req.body;

  if (!paperText || typeof paperText !== 'string') {
    res.status(400).json({ error: 'Missing "paperText" in request body.' });
    return;
  }

  if (paperText.length < 100) {
    res.status(400).json({ error: 'Paper text is too short. Please provide the full paper text.' });
    return;
  }

  // Check cache first — return normal JSON (no SSE needed)
  const cached = getCache<ImplementResult>(paperText);
  if (cached) {
    console.log('[Implement] Returning cached result (instant)');
    res.json({ success: true, data: cached });
    return;
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const startTime = Date.now();

    // Step 1: Analyze paper
    sendEvent(res, 'step', { step: 1, total: 4, message: 'Analyzing paper' });
    console.log('[Pipeline] Step 1/4: Analyzing paper...');
    const analysis = await analyzePaper(paperText);
    sendEvent(res, 'step', { step: 1, total: 4, message: 'Analyzing paper', done: true });

    // Step 2: Create implementation plan
    sendEvent(res, 'step', { step: 2, total: 4, message: 'Creating implementation plan' });
    console.log('[Pipeline] Step 2/4: Creating implementation plan...');
    const plan = await createImplementationPlan(paperText, analysis);
    sendEvent(res, 'step', { step: 2, total: 4, message: 'Creating implementation plan', done: true });

    // Step 3: Generate notebook
    sendEvent(res, 'step', { step: 3, total: 4, message: 'Generating notebook' });
    console.log('[Pipeline] Step 3/4: Generating notebook...');
    const notebook = await generateNotebook(paperText, analysis, plan);
    sendEvent(res, 'step', { step: 3, total: 4, message: 'Generating notebook', done: true });

    // Step 4: Upload to Gist
    sendEvent(res, 'step', { step: 4, total: 4, message: 'Uploading to Colab' });
    console.log('[Pipeline] Step 4/4: Uploading to Gist...');
    const gist = await uploadNotebookToGist(notebook.notebookJson, notebook.colabTitle);
    sendEvent(res, 'step', { step: 4, total: 4, message: 'Uploading to Colab', done: true });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Pipeline] Complete in ${duration}s`);

    const responseData: ImplementResult = {
      colabUrl: gist.colabUrl,
      gistUrl: gist.gistUrl,
      downloadUrl: gist.rawUrl,

      analysis: {
        title: analysis.title,
        domain: analysis.domain,
        coreProblem: analysis.coreProblem,
        coreContribution: analysis.coreContribution,
        paperComplexity: analysis.paperComplexity,
        methods: analysis.methods,
        requiredLibraries: analysis.requiredLibraries,
      },

      plan: {
        summary: plan.summary,
        framework: plan.framework,
        frameworkReasoning: plan.frameworkReasoning,
        simplifications: plan.simplifications,
        steps: plan.steps,
        demoDataStrategy: plan.demoDataStrategy,
      },

      notebookCells: notebook.cells,

      meta: {
        totalCells: notebook.cells.length,
        codeCells: notebook.cells.filter((c) => c.cell_type === 'code').length,
        markdownCells: notebook.cells.filter((c) => c.cell_type === 'markdown').length,
        pipelineDurationSeconds: parseFloat(duration),
      },
    };

    // Cache the result
    setCache(paperText, responseData);

    // Send the final result
    sendEvent(res, 'result', responseData);
    res.end();
  } catch (error) {
    console.error('[Pipeline] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    sendEvent(res, 'error', { error: 'Failed to generate implementation.', detail: message });
    res.end();
  }
});

export default router;
