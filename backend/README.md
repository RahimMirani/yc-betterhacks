# Better Papers Backend

TypeScript backend API for the Better Papers application.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run in development mode:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Run production build:
   ```bash
   npm start
   ```

## Project Structure

```
backend/
├── src/
│   └── index.ts          # Main server entry point
├── dist/                 # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /api/test` - Test endpoint
- `POST /api/papers/upload` - Upload a PDF (multipart `file`). Returns `{ paperId, filename }`. Text is extracted, chunked, embedded (OpenAI), and stored in an in-memory vector store for semantic search.
- `GET /api/papers/:paperId/file` - Stream the uploaded PDF file
- `POST /api/explain` - Get an AI explanation for a selected passage. Uses vector search to retrieve relevant chunks, then Claude for the reply. Body: `{ paperId, selectedText, messages? }`. Returns `{ reply }`

## Environment Variables

Create a `.env` file for environment-specific configuration:
- `PORT` - Server port (default: 3001)
- `ANTHROPIC_API_KEY` - Required for `/api/explain` (Claude API)
- `VOYAGE_API_KEY` - (Recommended) Embeddings via Voyage AI (Anthropic’s partner). Sign up at [voyageai.com](https://www.voyageai.com). Enables vector search on upload and explain.
- `OPENAI_API_KEY` - Alternative to Voyage for embeddings. If set, used instead of Voyage when `VOYAGE_API_KEY` is not set.

  **Note:** Anthropic does not provide an embedding model. Use either Voyage or OpenAI for vector search. If neither is set, upload still works and explain uses full-paper context (no semantic search).
