# Better Papers Backend

TypeScript backend API for the Better Papers application. Uses **Neon** (Postgres + pgvector) for storage and embeddings, **OpenAI** for embeddings, and **Claude** for explanations and citation relevance.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Database (Neon)**  
   Create a Neon project and run the migration to enable the `vector` extension and create tables:
   - In Neon SQL Editor, run the contents of `src/db/migrations/001_create_tables.sql`.

3. **Environment**  
   Copy `.env.example` to `.env` and set:
   - `DATABASE_URL` – Neon connection string (required)
   - `ANTHROPIC_API_KEY` – Claude API (required for explain and citation enrichment)
   - `OPENAI_API_KEY` – OpenAI API (required for embeddings)

4. **Run**
   ```bash
   npm run dev
   ```

## Project Structure

```
backend/
├── src/
│   ├── config/       # env validation (zod)
│   ├── db/           # Neon pool, migrations, queries (papers, citations)
│   ├── middleware/   # upload (multer), error-handler
│   ├── controllers/  # papers (upload, get, file, citations, text)
│   ├── routes/      # papers, explain
│   ├── services/    # pdf-parser, embeddings (OpenAI + Neon), citation-*, claude, semantic-scholar
│   ├── types/
│   └── utils/       # text chunking, citation patterns
├── package.json
└── tsconfig.json
```

## API Endpoints

- `GET /health` – Health check
- `POST /api/papers/upload` – Upload a PDF. Text is extracted, chunked, embedded (OpenAI), stored in Neon (papers + paper_chunks + citations). Returns `{ paperId, filename, data }`.
- `GET /api/papers/:paperId` – Paper metadata and citation list
- `GET /api/papers/:paperId/file` – Stream the uploaded PDF
- `GET /api/papers/:paperId/text` – Raw text and citation marker positions
- `GET /api/papers/:paperId/citations/:citationKey` – Citation context (with optional Semantic Scholar enrichment)
- `POST /api/explain` – Explain a selected passage. Uses Neon pgvector similarity search for relevant chunks, then Claude. Body: `{ paperId, selectedText, messages? }`. Returns `{ reply }`.

## Environment Variables

| Variable            | Required | Description                          |
|---------------------|----------|--------------------------------------|
| `PORT`              | No       | Server port (default 3001)          |
| `DATABASE_URL`      | Yes      | Neon Postgres connection string      |
| `ANTHROPIC_API_KEY` | Yes      | Claude API (explain + citation)      |
| `OPENAI_API_KEY`    | Yes      | OpenAI API (embeddings for pgvector) |
