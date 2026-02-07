import { Router, Request, Response } from 'express';
import { runFullPipeline } from '../services/claude';
import { uploadNotebookToGist } from '../services/gist';

const router = Router();

/**
 * POST /api/implement-paper
 *
 * Accepts the extracted paper text and runs the full pipeline:
 * 1. Analyze the paper (Claude)
 * 2. Create an implementation plan (Claude)
 * 3. Generate a Colab notebook (Claude)
 * 4. Upload the notebook to GitHub Gist
 * 5. Return everything: analysis, plan, notebook preview, and Colab URL
 */
router.post('/implement-paper', async (req: Request, res: Response) => {
  try {
    const { paperText } = req.body;

    if (!paperText || typeof paperText !== 'string') {
      res.status(400).json({ error: 'Missing "paperText" in request body.' });
      return;
    }

    if (paperText.length < 100) {
      res.status(400).json({ error: 'Paper text is too short. Please provide the full paper text.' });
      return;
    }

    console.log(`[Implement] Starting pipeline for paper (${paperText.length} chars)...`);
    const startTime = Date.now();

    // Run the 3-step Claude pipeline
    const { analysis, plan, notebook } = await runFullPipeline(paperText);

    // Upload to GitHub Gist
    console.log('[Implement] Uploading notebook to Gist...');
    const gist = await uploadNotebookToGist(notebook.notebookJson, notebook.colabTitle);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Implement] Pipeline complete in ${duration}s`);

    res.json({
      success: true,
      data: {
        // Colab link (the main thing the user wants)
        colabUrl: gist.colabUrl,
        gistUrl: gist.gistUrl,
        downloadUrl: gist.rawUrl,

        // Analysis summary (for the preview panel)
        analysis: {
          title: analysis.title,
          domain: analysis.domain,
          coreProblem: analysis.coreProblem,
          coreContribution: analysis.coreContribution,
          paperComplexity: analysis.paperComplexity,
          methods: analysis.methods,
          requiredLibraries: analysis.requiredLibraries,
        },

        // Implementation plan (for the preview panel)
        plan: {
          summary: plan.summary,
          framework: plan.framework,
          frameworkReasoning: plan.frameworkReasoning,
          simplifications: plan.simplifications,
          steps: plan.steps,
          demoDataStrategy: plan.demoDataStrategy,
        },

        // Notebook cells (for the preview panel to render)
        notebookCells: notebook.cells,

        // Metadata
        meta: {
          totalCells: notebook.cells.length,
          codeCells: notebook.cells.filter((c) => c.cell_type === 'code').length,
          markdownCells: notebook.cells.filter((c) => c.cell_type === 'markdown').length,
          pipelineDurationSeconds: parseFloat(duration),
        },
      },
    });
  } catch (error) {
    console.error('[Implement] Pipeline error:', error);

    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({
      error: 'Failed to generate implementation.',
      detail: message,
    });
  }
});

export default router;
