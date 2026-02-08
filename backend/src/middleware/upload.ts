import multer from 'multer';
import { config } from '../config';

export const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxPdfSizeMB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
}).single('file');
