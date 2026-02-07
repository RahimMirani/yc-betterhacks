import { Router, Request, Response } from 'express';
import multer from 'multer';
import { extractTextFromPdf } from '../services/pdfExtractor';
import { config } from '../config';

const router = Router();

// Configure multer for PDF uploads (store in memory, not disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxPdfSizeMB * 1024 * 1024, // Convert MB to bytes
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

/**
 * POST /api/extract-pdf
 * Accepts a PDF file upload and returns extracted text content.
 */
router.post('/extract-pdf', upload.single('pdf'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No PDF file provided. Send a file with field name "pdf".' });
      return;
    }

    const result = await extractTextFromPdf(req.file.buffer);

    if (!result.text || result.text.length === 0) {
      res.status(422).json({ error: 'Could not extract text from PDF. The file may be scanned/image-based.' });
      return;
    }

    res.json({
      success: true,
      data: {
        text: result.text,
        numPages: result.numPages,
        title: result.title,
        characterCount: result.text.length,
      },
    });
  } catch (error) {
    // Handle multer file size error
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ error: `File too large. Maximum size is ${config.maxPdfSizeMB}MB.` });
        return;
      }
    }

    console.error('PDF extraction error:', error);
    res.status(500).json({ error: 'Failed to extract text from PDF.' });
  }
});

/**
 * Resolves a user-supplied URL to a direct PDF download link.
 * Supports arXiv abstract pages, Semantic Scholar, and direct PDF links.
 */
function resolvePdfUrl(input: string): string {
  let url = input.trim();

  // arXiv abstract page → PDF: https://arxiv.org/abs/1706.03762 → https://arxiv.org/pdf/1706.03762
  if (/arxiv\.org\/abs\//.test(url)) {
    url = url.replace('/abs/', '/pdf/');
  }

  // Ensure arXiv PDF URLs end with .pdf for a clean download
  if (/arxiv\.org\/pdf\//.test(url) && !url.endsWith('.pdf')) {
    url = url + '.pdf';
  }

  // Semantic Scholar: redirect to their PDF endpoint if it's a paper page
  // e.g. https://www.semanticscholar.org/paper/... → handled by fetch redirect

  return url;
}

/**
 * POST /api/extract-pdf-url
 * Accepts a URL pointing to a PDF (arXiv, Semantic Scholar, direct link).
 * Fetches the PDF, extracts text, and returns it along with the PDF binary as base64.
 */
router.post('/extract-pdf-url', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'Please provide a valid URL.' });
      return;
    }

    const pdfUrl = resolvePdfUrl(url);

    // Fetch the PDF with a timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    let response: globalThis.Response;
    try {
      response = await fetch(pdfUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BetterPapers/1.0)',
        },
      });
    } catch (fetchErr: any) {
      if (fetchErr.name === 'AbortError') {
        res.status(408).json({ error: 'Request timed out. The URL took too long to respond.' });
        return;
      }
      throw fetchErr;
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      res.status(400).json({ error: `Failed to fetch PDF from URL (HTTP ${response.status}).` });
      return;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('pdf') && !contentType.includes('octet-stream')) {
      res.status(400).json({ error: 'The URL does not point to a PDF file.' });
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Check file size
    if (buffer.length > config.maxPdfSizeMB * 1024 * 1024) {
      res.status(413).json({ error: `PDF too large. Maximum size is ${config.maxPdfSizeMB}MB.` });
      return;
    }

    const result = await extractTextFromPdf(buffer);

    if (!result.text || result.text.length === 0) {
      res.status(422).json({ error: 'Could not extract text from PDF. The file may be scanned/image-based.' });
      return;
    }

    // Return text extraction result + base64 PDF for the frontend viewer
    res.json({
      success: true,
      data: {
        text: result.text,
        numPages: result.numPages,
        title: result.title,
        characterCount: result.text.length,
        pdfBase64: buffer.toString('base64'),
      },
    });
  } catch (error) {
    console.error('PDF URL extraction error:', error);
    res.status(500).json({ error: 'Failed to fetch or extract PDF from URL.' });
  }
});

export default router;
