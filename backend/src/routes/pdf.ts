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

export default router;
