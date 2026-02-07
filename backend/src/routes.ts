import { Router, Request, Response } from "express";
import multer from "multer";
import pdfParse from "pdf-parse";

const parsePdf = pdfParse as unknown as (buffer: Buffer) => Promise<{ text: string }>;
import { askClaude } from "./claude";
import { explainPrompt, implementPrompt, notebookPrompt } from "./prompts";
import { markdownToNotebook } from "./notebook";

const router = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10 MB

// POST /explain — body: { text: string, level: string }
router.post("/explain", async (req: Request, res: Response) => {
  try {
    const { text, level } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'text'" });
    }
    const prompt = explainPrompt(text, level ?? "intermediate");
    const explanation = await askClaude(prompt);
    res.json({ explanation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Explain failed" });
  }
});

// POST /implement — body: { text: string }
router.post("/implement", async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'text'" });
    }
    const prompt = implementPrompt(text);
    const code = await askClaude(prompt);
    res.json({ code });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Implement failed" });
  }
});

// POST /notebook — multipart form with PDF file, extract text, call Claude, return .ipynb
router.post("/notebook", upload.single("pdf"), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file || file.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "Missing or invalid PDF file; use field name 'pdf'" });
    }
    const data = await parsePdf(file.buffer);
    const text = data.text;
    if (!text?.trim()) {
      return res.status(400).json({ error: "No text could be extracted from the PDF" });
    }
    const prompt = notebookPrompt(text);
    const raw = await askClaude(prompt);

    let notebook: { cells: unknown[]; nbformat: number; nbformat_minor: number; metadata: Record<string, unknown> };
    try {
      const parsed = JSON.parse(raw.trim());
      if (parsed && typeof parsed.cells === "object" && Array.isArray(parsed.cells)) {
        notebook = {
          nbformat: parsed.nbformat ?? 4,
          nbformat_minor: parsed.nbformat_minor ?? 4,
          metadata: parsed.metadata ?? {},
          cells: parsed.cells,
        };
      } else {
        notebook = markdownToNotebook(raw);
      }
    } catch {
      notebook = markdownToNotebook(raw);
    }

    const filename = "notebook.ipynb";
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(JSON.stringify(notebook, null, 2));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Notebook failed" });
  }
});

export default router;