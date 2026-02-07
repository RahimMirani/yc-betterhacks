import express, { Request, Response } from 'express'
import cors from 'cors'
import { papersRouter } from './routes/papers'
import { errorHandler } from './middleware/error-handler'
import { config } from './config';
import pdfRoutes from './routes/pdf';
import implementRoutes from './routes/implement';

const app = express();

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Better Papers API is running' })
})

app.use('/api/papers', papersRouter)

app.use(errorHandler)

// Routes
app.use('/api', pdfRoutes);
app.use('/api', implementRoutes);

// Start server
app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
  console.log(`Health check: http://localhost:${config.port}/health`);
});
