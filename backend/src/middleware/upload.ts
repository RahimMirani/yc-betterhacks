import multer from 'multer'
import { AppError } from './error-handler'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

const storage = multer.memoryStorage()

export const uploadPdf = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new AppError('Only PDF files are allowed', 400))
      return
    }
    cb(null, true)
  },
}).single('file')
