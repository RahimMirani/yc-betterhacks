import express, { Request, Response } from 'express';
import { config } from './config';
import pdfRoutes from './routes/pdf';
import implementRoutes from './routes/implement';
import { papersRouter } from './routes/papers';
import { explainRouter } from './routes/explain';

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Better Papers API is running' });
});

// Routes: existing (extract-pdf, implement-paper, pdf-by-url) + merged (papers, explain)
app.use('/api', pdfRoutes);
app.use('/api', implementRoutes);
app.use('/api/papers', papersRouter);
app.use('/api/explain', explainRouter);

// Start server
app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
  console.log(`Health check: http://localhost:${config.port}/health`);
});
