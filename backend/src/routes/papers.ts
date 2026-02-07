import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { extractTextFromPdf } from '../pdf';
import { savePaper, getPaper } from '../store';
import { ingestPaperText } from '../ingest';

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    if (ok) cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
});

const router = express.Router();

router.post(
  '/upload',
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
      try {
        if (!req.file) {
          res.status(400).json({ error: 'No file uploaded' });
          return;
        }
        const buffer = fs.readFileSync(req.file.path);
        const fullText = await extractTextFromPdf(buffer);
        const paperId = path.basename(req.file.filename, path.extname(req.file.filename));
        const filename = req.file.originalname || req.file.filename;
        savePaper(paperId, filename, fullText);
        await ingestPaperText(paperId, fullText);
        res.status(201).json({ paperId, filename });
      } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({
          error: err instanceof Error ? err.message : 'Failed to process PDF',
        });
      }
    }
);

router.get('/:paperId/file', (req: Request, res: Response): void => {
  const { paperId } = req.params;
  const paper = getPaper(paperId);
  if (!paper) {
    res.status(404).json({ error: 'Paper not found' });
    return;
  }
  const filePath = path.join(uploadDir, `${paperId}.pdf`);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'PDF file not found' });
    return;
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.sendFile(filePath);
});

export const papersRouter = router;
