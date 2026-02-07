import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { papersRouter } from './routes/papers';
import { explainRouter } from './routes/explain';
import { errorHandler } from './middleware/error-handler';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Better Papers API is running' });
});

app.get('/api/test', (_req: Request, res: Response) => {
  res.json({ message: 'Backend API is working!' });
});

app.use('/api/papers', papersRouter);
app.use('/api/explain', explainRouter);

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
  console.log(`Health check: http://localhost:${env.PORT}/health`);
});
